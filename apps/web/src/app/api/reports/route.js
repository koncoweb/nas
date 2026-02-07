import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

async function generateReportNumber(projectId, reportType, explicitDate) {
  // Fetch project + quotation reference
  const projRows = await sql`
    SELECT p.id, p.project_number, p.quotation_id, q.quote_number
    FROM projects p
    LEFT JOIN quotations q ON p.quotation_id = q.id
    WHERE p.id = ${parseInt(projectId)}
    LIMIT 1
  `;
  const proj = projRows[0] || {};
  const quoteRef = (proj.quote_number || proj.project_number || "").toString();

  // Decide date source (YYYYMM)
  const baseDate = explicitDate ? new Date(explicitDate) : new Date();
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, "0");

  const prefix = reportType === "delivery_order" ? "DO" : "WDR";
  // Normalize quote reference for safe code
  const normalizedRef = quoteRef
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const base = `${prefix}-${yyyy}${mm}-${normalizedRef}`;

  // Ensure uniqueness by appending incremental suffix if needed
  const existing = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM project_reports
    WHERE delivery_number LIKE ${base + "%"}
  `;
  const count = existing[0]?.cnt || 0;
  const finalNumber =
    count > 0 ? `${base}-${String(count + 1).padStart(2, "0")}` : base;
  return finalNumber;
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const project_id = searchParams.get("project_id") || "";
    const type = searchParams.get("type") || ""; // optional filter by report_type
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let whereConditions = ["1=1"];
    let queryParams = [];

    if (search) {
      whereConditions.push(`(
        LOWER(pr.work_summary) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.materials_used) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.recommendations) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.customer_feedback) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.issues_encountered) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.delivery_items) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(p.project_number) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(p.title) LIKE LOWER('%' || $${queryParams.length + 1} || '%')
      )`);
      queryParams.push(search);
    }

    if (status) {
      whereConditions.push(`pr.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (project_id) {
      whereConditions.push(`pr.project_id = $${queryParams.length + 1}`);
      queryParams.push(parseInt(project_id));
    }

    if (type) {
      whereConditions.push(`pr.report_type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM project_reports pr
      LEFT JOIN projects p ON pr.project_id = p.id
      WHERE ${whereClause}
    `;
    const countResult = await sql(countQuery, queryParams);
    const total = parseInt(countResult[0]?.total || 0);
    const pages = Math.ceil(total / limit);

    // Get reports with related data
    const reportsQuery = `
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
      WHERE ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const reports = await sql(reportsQuery, [...queryParams, limit, offset]);

    return Response.json({
      reports: reports || [],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("GET /api/reports error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Check permissions - leaders, engineers, and sales can create reports
    if (!["leader", "engineer", "sales"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      project_id,
      report_type = "work_done",
      completion_date,
      work_summary,
      materials_used = null,
      recommendations = null,
      customer_feedback = null,
      issues_encountered = null,
      // Delivery Order fields
      delivery_number = null,
      delivered_date = null,
      delivery_items = null,
      delivery_notes = null,
    } = body;

    // Validate required common fields
    if (!project_id) {
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    // Conditional validation by report type
    if (report_type === "work_done") {
      if (!work_summary || !work_summary.trim()) {
        return Response.json(
          { error: "Work summary is required for Work Done report" },
          { status: 400 },
        );
      }
      if (!completion_date) {
        return Response.json(
          { error: "Completion date is required" },
          { status: 400 },
        );
      }
    } else if (report_type === "delivery_order") {
      if (!delivered_date) {
        return Response.json(
          { error: "Delivered date is required for Delivery Order" },
          { status: 400 },
        );
      }
      if (!delivery_items || !String(delivery_items).trim()) {
        return Response.json(
          { error: "Delivery items are required for Delivery Order" },
          { status: 400 },
        );
      }
    } else {
      return Response.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Verify project exists
    const projectCheck = await sql`
      SELECT id FROM projects WHERE id = ${parseInt(project_id)} LIMIT 1
    `;

    if (!projectCheck.length) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Helper function to convert empty strings to null for dates
    const sanitizeDate = (dateValue) => {
      if (!dateValue || dateValue === "") return null;
      return dateValue;
    };

    // Map dates & generate number
    const finalCompletionDate = sanitizeDate(
      report_type === "delivery_order" ? delivered_date : completion_date,
    );

    const finalDocNumber =
      delivery_number ||
      (await generateReportNumber(
        project_id,
        report_type,
        finalCompletionDate,
      ));

    // Build insert with sanitized dates
    const result = await sql`
      INSERT INTO project_reports (
        project_id, created_by, report_type, completion_date, work_summary,
        materials_used, recommendations, customer_feedback, issues_encountered,
        delivery_number, delivered_date, delivery_items, delivery_notes,
        status
      )
      VALUES (
        ${parseInt(project_id)}, ${userId}, ${report_type}, ${sanitizeDate(finalCompletionDate)}, ${work_summary || null},
        ${materials_used}, ${recommendations}, ${customer_feedback}, ${issues_encountered},
        ${finalDocNumber}, ${sanitizeDate(delivered_date)}, ${delivery_items}, ${delivery_notes},
        'pending'
      )
      RETURNING *
    `;

    return Response.json({
      report: result[0],
      message: "Report created successfully",
    });
  } catch (err) {
    console.error("POST /api/reports error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
