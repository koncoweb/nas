import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { migrations } from "@/app/api/utils/migrations";

/**
 * Run database migrations
 * POST /api/migrations/run
 *
 * Body:
 * - fromId: (optional) Run migrations starting from this ID
 * - dryRun: (optional) If true, only show SQL without executing
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only leaders can run migrations
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role;

    if (userRole !== "leader") {
      return Response.json(
        { error: "Only leaders can run database migrations" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { fromId = 1, dryRun = false } = body;

    // Get migrations to run
    const migrationsToRun = migrations.filter((m) => m.id >= fromId);

    if (migrationsToRun.length === 0) {
      return Response.json({
        message: "No migrations to run",
        migrations: [],
      });
    }

    if (dryRun) {
      return Response.json({
        message: "Dry run - no changes made",
        migrations: migrationsToRun.map((m) => ({
          id: m.id,
          name: m.name,
          sql: m.sql,
        })),
      });
    }

    // Run migrations
    const results = [];
    const errors = [];

    for (const migration of migrationsToRun) {
      try {
        console.log(`Running migration ${migration.id}: ${migration.name}`);

        // Execute migration SQL
        await sql.unsafe(migration.sql);

        results.push({
          id: migration.id,
          name: migration.name,
          status: "success",
        });

        console.log(`✓ Migration ${migration.id} completed successfully`);
      } catch (error) {
        console.error(`✗ Migration ${migration.id} failed:`, error);

        errors.push({
          id: migration.id,
          name: migration.name,
          status: "error",
          error: error.message,
        });

        // Stop on first error
        break;
      }
    }

    if (errors.length > 0) {
      return Response.json(
        {
          message: "Migrations failed",
          results,
          errors,
        },
        { status: 500 },
      );
    }

    return Response.json({
      message: `Successfully ran ${results.length} migration(s)`,
      results,
    });
  } catch (err) {
    console.error("POST /api/migrations/run error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Get list of available migrations
 * GET /api/migrations/run
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only leaders can view migrations
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role;

    if (userRole !== "leader") {
      return Response.json(
        { error: "Only leaders can view database migrations" },
        { status: 403 },
      );
    }

    return Response.json({
      migrations: migrations.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.sql.split("\n")[0].replace("--", "").trim(),
      })),
      total: migrations.length,
    });
  } catch (err) {
    console.error("GET /api/migrations/run error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
