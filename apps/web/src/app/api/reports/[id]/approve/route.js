import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const reportId = parseInt(params.id);

    // Only leaders (managers) can approve
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";
    if (userRole !== "leader") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Fetch report
    const reportRows =
      await sql`SELECT * FROM project_reports WHERE id = ${reportId} LIMIT 1`;
    if (!reportRows.length) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }
    const report = reportRows[0];

    const finalDate = report.delivered_date || report.completion_date || null;

    // Approve: mark report completed, set signed date if empty, and complete project
    await sql.transaction((txn) => [
      txn`UPDATE project_reports SET status = 'completed', customer_signed_date = COALESCE(customer_signed_date, CURRENT_DATE) WHERE id = ${reportId}`,
      report.project_id
        ? txn`UPDATE projects SET status = 'completed', actual_completion = COALESCE(actual_completion, ${finalDate}), updated_at = CURRENT_TIMESTAMP WHERE id = ${report.project_id}`
        : txn`SELECT 1`,
    ]);

    const updated = await sql`
      SELECT 
        pr.*, p.project_number, p.title as project_title,
        c.company_name as customer_name
      FROM project_reports pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE pr.id = ${reportId}
      LIMIT 1
    `;

    return Response.json({
      report: updated[0],
      message: "Report approved and project marked completed",
    });
  } catch (err) {
    console.error("POST /api/reports/[id]/approve error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
