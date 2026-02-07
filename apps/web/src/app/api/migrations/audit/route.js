import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * Audit database schema - compare expected vs actual
 * GET /api/migrations/audit
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only leaders can audit
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role;

    if (userRole !== "leader") {
      return Response.json(
        { error: "Only leaders can audit database" },
        { status: 403 },
      );
    }

    // Get all tables
    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    // Get all indexes
    const indexes = await sql`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;

    // Get all functions
    const functions = await sql`
      SELECT proname, pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY proname
    `;

    // Get all triggers
    const triggers = await sql`
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        pg_get_triggerdef(oid) as definition
      FROM pg_trigger 
      WHERE tgisinternal = false
      ORDER BY tgname
    `;

    // Get all foreign keys
    const foreignKeys = await sql`
      SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `;

    // Get extensions
    const extensions = await sql`
      SELECT extname, extversion FROM pg_extension
      WHERE extname != 'plpgsql'
      ORDER BY extname
    `;

    // Expected tables
    const expectedTables = [
      "approval_workflows",
      "auth_accounts",
      "auth_sessions",
      "auth_users",
      "auth_verification_token",
      "company_settings",
      "customers",
      "invoice_line_items",
      "invoices",
      "material_request_items",
      "material_requests",
      "materials",
      "payments",
      "project_costs",
      "project_labor",
      "project_reports",
      "projects",
      "quotation_line_items",
      "quotation_scope_work",
      "quotations",
    ];

    // Check for missing tables
    const actualTables = tables.map((t) => t.tablename);
    const missingTables = expectedTables.filter(
      (t) => !actualTables.includes(t),
    );
    const extraTables = actualTables.filter((t) => !expectedTables.includes(t));

    // Check for missing extensions
    const expectedExtensions = ["pg_trgm"];
    const actualExtensions = extensions.map((e) => e.extname);
    const missingExtensions = expectedExtensions.filter(
      (e) => !actualExtensions.includes(e),
    );

    // Check for missing functions
    const expectedFunctions = [
      "update_updated_at_column",
      "set_mri_estimated_total_cost",
      "refresh_mr_total_cost",
    ];
    const actualFunctions = functions.map((f) => f.proname);
    const missingFunctions = expectedFunctions.filter(
      (f) => !actualFunctions.includes(f),
    );

    // Database size
    const dbSize = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    // Table sizes
    const tableSizes = await sql`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    // Row counts
    const rowCounts = {};
    for (const table of actualTables) {
      try {
        const count = await sql.unsafe(
          `SELECT COUNT(*) as count FROM ${table}`,
        );
        rowCounts[table] = parseInt(count[0].count);
      } catch (error) {
        rowCounts[table] = "ERROR";
      }
    }

    return Response.json({
      status: "ok",
      database: {
        size: dbSize[0].size,
        connection: "healthy",
      },
      schema: {
        tables: {
          expected: expectedTables.length,
          actual: actualTables.length,
          missing: missingTables,
          extra: extraTables,
          list: actualTables,
        },
        indexes: {
          total: indexes.length,
          list: indexes.map((i) => ({
            table: i.tablename,
            name: i.indexname,
          })),
        },
        functions: {
          expected: expectedFunctions.length,
          actual: actualFunctions.length,
          missing: missingFunctions,
          list: actualFunctions,
        },
        triggers: {
          total: triggers.length,
          list: triggers.map((t) => ({
            name: t.trigger_name,
            table: t.table_name,
          })),
        },
        foreignKeys: {
          total: foreignKeys.length,
          list: foreignKeys.map((fk) => ({
            from: `${fk.table_name}.${fk.column_name}`,
            to: `${fk.foreign_table_name}.${fk.foreign_column_name}`,
            onDelete: fk.delete_rule,
          })),
        },
        extensions: {
          expected: expectedExtensions.length,
          actual: actualExtensions.length,
          missing: missingExtensions,
          list: extensions.map((e) => ({
            name: e.extname,
            version: e.extversion,
          })),
        },
      },
      data: {
        rowCounts,
        tableSizes: tableSizes.map((t) => ({
          table: t.tablename,
          size: t.size,
          bytes: parseInt(t.bytes),
        })),
      },
      migrations: {
        total: 16,
        note: "Run POST /api/migrations/run to apply all migrations",
      },
      issues: {
        critical: [
          ...missingTables.map((t) => `Missing table: ${t}`),
          ...missingExtensions.map((e) => `Missing extension: ${e}`),
          ...missingFunctions.map((f) => `Missing function: ${f}`),
        ],
        warnings: extraTables.map((t) => `Extra table (not in schema): ${t}`),
      },
      healthy:
        missingTables.length === 0 &&
        missingExtensions.length === 0 &&
        missingFunctions.length === 0,
    });
  } catch (err) {
    console.error("GET /api/migrations/audit error", err);
    return Response.json(
      {
        error: "Internal Server Error",
        message: err.message,
      },
      { status: 500 },
    );
  }
}
