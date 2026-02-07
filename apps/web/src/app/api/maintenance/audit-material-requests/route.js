import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only leaders can run maintenance
    const [{ user_role }] = await sql`
      SELECT user_role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    if (user_role !== "leader") {
      return new Response(
        JSON.stringify({ error: "Only leaders can run this audit" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 1) Check duplicates in approval_workflows (should be 0 after unique index)
    const duplicates = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM (
        SELECT material_request_id, step_order, COUNT(*)
        FROM approval_workflows
        GROUP BY material_request_id, step_order
        HAVING COUNT(*) > 1
      ) d
    `;

    // 2) Count requests with mismatched totals
    const mismatchRows = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM material_requests mr
      JOIN (
        SELECT material_request_id, ROUND(SUM(COALESCE(estimated_total_cost,0)), 2) AS sum_total
        FROM material_request_items
        GROUP BY material_request_id
      ) s ON s.material_request_id = mr.id
      WHERE COALESCE(mr.estimated_total_cost,0) <> s.sum_total
    `;

    const mismatchedCount = mismatchRows[0]?.cnt || 0;
    const duplicatePairs = duplicates[0]?.cnt || 0;

    // 3) Fix any inconsistent line totals on items
    const fixItems = await sql`
      WITH to_fix AS (
        SELECT id, quantity, estimated_unit_cost
        FROM material_request_items
        WHERE estimated_total_cost IS NULL
           OR estimated_total_cost <> ROUND(COALESCE(quantity,0) * COALESCE(estimated_unit_cost,0), 2)
      )
      UPDATE material_request_items m
      SET estimated_total_cost = ROUND(COALESCE(m.quantity,0) * COALESCE(m.estimated_unit_cost,0), 2)
      FROM to_fix f
      WHERE m.id = f.id
      RETURNING m.id
    `;

    // 4) Fix parent request totals
    const fixRequests = await sql`
      WITH sums AS (
        SELECT material_request_id, ROUND(SUM(COALESCE(estimated_total_cost,0)), 2) AS sum_total
        FROM material_request_items
        GROUP BY material_request_id
      )
      UPDATE material_requests mr
      SET estimated_total_cost = COALESCE(s.sum_total, 0), updated_at = CURRENT_TIMESTAMP
      FROM sums s
      WHERE mr.id = s.material_request_id
        AND COALESCE(mr.estimated_total_cost,0) <> COALESCE(s.sum_total, 0)
      RETURNING mr.id
    `;

    return new Response(
      JSON.stringify({
        ok: true,
        duplicates_before: duplicatePairs,
        items_fixed: fixItems.length,
        requests_fixed: fixRequests.length,
        mismatched_before: mismatchedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("POST /api/maintenance/audit-material-requests error", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
