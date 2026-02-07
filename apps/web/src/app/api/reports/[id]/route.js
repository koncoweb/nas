import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

async function generateReportNumber(projectId, reportType, explicitDate) {
  const projRows = await sql`
    SELECT p.id, p.project_number, p.quotation_id, q.quote_number
    FROM projects p
    LEFT JOIN quotations q ON p.quotation_id = q.id
    WHERE p.id = ${parseInt(projectId)}
    LIMIT 1
  `;
  const proj = projRows[0] || {};
  const quoteRef = (proj.quote_number || proj.project_number || "").toString();
  const baseDate = explicitDate ? new Date(explicitDate) : new Date();
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, "0");
  const prefix = reportType === "delivery_order" ? "DO" : "WDR";
  const normalizedRef = quoteRef
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const base = `${prefix}-${yyyy}${mm}-${normalizedRef}`;
  const existing = await sql`
    SELECT COUNT(*)::int AS cnt FROM project_reports WHERE delivery_number LIKE ${base + "%"}
  `;
  const cnt = existing[0]?.cnt || 0;
  return cnt > 0 ? `${base}-${String(cnt + 1).padStart(2, "0")}` : base;
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reportId = parseInt(params.id);

    // Get report with related data
    const result = await sql`
      SELECT 
        pr.*,
        p.project_number,
        p.title as project_title,
        c.company_name as customer_name,
        u.name as created_by_name
      FROM project_reports pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON pr.created_by = u.id
      WHERE pr.id = ${reportId}
      LIMIT 1
    `;

    if (!result.length) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    return Response.json({ report: result[0] });
  } catch (err) {
    console.error("GET /api/reports/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const reportId = parseInt(params.id);

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Check permissions - leaders and engineers can update reports
    if (!["leader", "engineer"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if report exists and get current data
    const reportCheck = await sql`
      SELECT * FROM project_reports WHERE id = ${reportId} LIMIT 1
    `;

    if (!reportCheck.length) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    const currentReport = reportCheck[0];

    // Additional permission check - only creator or leader can edit
    if (userRole !== "leader" && currentReport.created_by !== userId) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      report_type = currentReport.report_type || "work_done",
      completion_date,
      work_summary,
      materials_used = null,
      recommendations = null,
      customer_feedback = null,
      issues_encountered = null,
      status = currentReport.status,
      // Delivery order fields
      delivery_number = currentReport.delivery_number || null,
      delivered_date = currentReport.delivered_date || null,
      delivery_items = currentReport.delivery_items || null,
      delivery_notes = currentReport.delivery_notes || null,
    } = body;

    // Validate status
    const validStatuses = ["pending", "customer_signed", "completed"];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    // Conditional validation
    if (report_type === "work_done") {
      if (!work_summary || !work_summary.trim()) {
        return Response.json(
          { error: "Work summary is required" },
          { status: 400 },
        );
      }
      if (!completion_date && !currentReport.completion_date) {
        return Response.json(
          { error: "Completion date is required" },
          { status: 400 },
        );
      }
    } else if (report_type === "delivery_order") {
      if (!delivered_date && !currentReport.delivered_date) {
        return Response.json(
          { error: "Delivered date is required for Delivery Order" },
          { status: 400 },
        );
      }
      if (!delivery_items && !currentReport.delivery_items) {
        return Response.json(
          { error: "Delivery items are required for Delivery Order" },
          { status: 400 },
        );
      }
    } else {
      return Response.json({ error: "Invalid report type" }, { status: 400 });
    }

    const finalCompletionDate =
      report_type === "delivery_order"
        ? delivered_date || currentReport.delivered_date
        : completion_date || currentReport.completion_date;

    // Generate number if missing
    const finalDocNumber =
      delivery_number ||
      currentReport.delivery_number ||
      (await generateReportNumber(
        currentReport.project_id,
        report_type,
        finalCompletionDate || currentReport.completion_date,
      ));

    // Update report
    const result = await sql`
      UPDATE project_reports 
      SET 
        report_type = ${report_type},
        completion_date = ${finalCompletionDate},
        work_summary = ${work_summary ?? currentReport.work_summary},
        materials_used = ${materials_used},
        recommendations = ${recommendations},
        customer_feedback = ${customer_feedback},
        issues_encountered = ${issues_encountered},
        status = ${status},
        delivery_number = ${finalDocNumber},
        delivered_date = ${delivered_date},
        delivery_items = ${delivery_items},
        delivery_notes = ${delivery_notes}
      WHERE id = ${reportId}
      RETURNING *
    `;

    const updatedReport = result[0];

    // Synchronize project status when report is completed
    if (status === "completed" && updatedReport?.project_id) {
      await sql`
        UPDATE projects
        SET status = 'completed',
            actual_completion = ${finalCompletionDate || currentReport.completion_date || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${updatedReport.project_id}
      `;
    }

    return Response.json({
      report: updatedReport,
      message: "Report updated successfully",
    });
  } catch (err) {
    console.error("PUT /api/reports/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const reportId = parseInt(params.id);

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Check permissions - only leaders can delete reports
    if (userRole !== "leader") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if report exists
    const reportCheck = await sql`
      SELECT id FROM project_reports WHERE id = ${reportId}
    `;

    if (!reportCheck.length) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete report
    await sql`
      DELETE FROM project_reports WHERE id = ${reportId}
    `;

    return Response.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/reports/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
