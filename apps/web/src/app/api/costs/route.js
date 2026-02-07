import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { QueryBuilder, validatePagination, validateInteger, validateNumeric, errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

// GET /api/costs?search=&cost_type=&project_id=&from=&to=&expense_type=&page=1&limit=10
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const cost_type = searchParams.get("cost_type") || "";
    const project_id = searchParams.get("project_id") || "";
    const expense_type = (searchParams.get("expense_type") || "").toLowerCase(); // 'project' | 'operational'
    const from = searchParams.get("from") || ""; // purchase_date >= from
    const to = searchParams.get("to") || ""; // purchase_date <= to
    
    const { page, limit, offset } = validatePagination(
      searchParams.get("page"),
      searchParams.get("limit")
    );

    // Build query using QueryBuilder
    const qb = new QueryBuilder();
    const whereClauses = ["1=1"];

    if (search) {
      whereClauses.push(`(
        LOWER(pc.description) LIKE LOWER(${qb.addParam(`%${search}%`)}) OR 
        LOWER(pc.vendor) LIKE LOWER(${qb.addParam(`%${search}%`)}) OR 
        LOWER(pc.receipt_number) LIKE LOWER(${qb.addParam(`%${search}%`)})
      )`);
    }

    if (cost_type) {
      whereClauses.push(qb.buildEqualityCondition('pc.cost_type', cost_type));
    }

    if (project_id) {
      const validProjectId = validateInteger(project_id, 1);
      if (validProjectId === parseInt(project_id)) {
        whereClauses.push(qb.buildEqualityCondition('pc.project_id', validProjectId));
      }
    }

    if (expense_type === "project") {
      whereClauses.push(`pc.project_id IS NOT NULL`);
    } else if (expense_type === "operational") {
      whereClauses.push(`pc.project_id IS NULL`);
    }

    if (from) {
      whereClauses.push(qb.buildEqualityCondition('pc.purchase_date >=', from));
    }

    if (to) {
      whereClauses.push(qb.buildEqualityCondition('pc.purchase_date <=', to));
    }

    const where = whereClauses.join(" AND ");

    // Get total count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      WHERE ${where}
    `;
    const countResult = await sql(countSql, qb.getParams());
    const total = countResult[0]?.total || 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    // Get costs with pagination
    const paginationClause = qb.buildPagination(limit, offset);
    const listSql = `
      SELECT 
        pc.*, 
        p.project_number, p.title AS project_title
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      WHERE ${where}
      ORDER BY pc.purchase_date DESC NULLS LAST, pc.created_at DESC
      ${paginationClause}
    `;
    const rows = await sql(listSql, qb.getParams());

    return successResponse({
      costs: rows || [],
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error("GET /api/costs error", err);
    return errorResponse("Internal Server Error");
  }
}

// POST /api/costs
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = session.user.id;
    const roleRes = await sql`SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1`;
    const role = roleRes[0]?.user_role || "sales";
    
    if (!["leader", "engineer", "accounting"].includes(role)) {
      return errorResponse("Permission denied", 403);
    }

    const body = await request.json();
    const {
      project_id = null,
      expense_type = null, // 'project' | 'operational' (optional hint)
      category = null, // operational category (UI-level)
      cost_type, // 'labor' | 'material' | 'equipment' | 'subcontractor' | 'travel' | 'other'
      description,
      material_id = null,
      quantity = 1,
      unit_cost = 0,
      total_cost = null,
      purchase_date = null,
      vendor = null,
      receipt_number = null,
    } = body;

    // Validate required fields
    if (!cost_type) {
      return errorResponse("cost_type is required", 400);
    }
    
    if (!description || !description.trim()) {
      return errorResponse("description is required", 400);
    }

    // Validate cost_type is one of allowed values
    const allowedCostTypes = ['labor', 'material', 'equipment', 'subcontractor', 'travel', 'other'];
    if (!allowedCostTypes.includes(cost_type)) {
      return errorResponse("Invalid cost_type", 400);
    }

    // If explicit expense_type provided, enforce project requirement accordingly
    const isOperational =
      (expense_type || "").toLowerCase() === "operational" ||
      (!project_id && expense_type == null);
    
    if (!isOperational && !project_id) {
      return errorResponse("project_id is required for project expenses", 400);
    }

    // Validate project_id if provided
    let validProjectId = null;
    if (project_id) {
      validProjectId = validateInteger(project_id, 1);
      if (validProjectId !== parseInt(project_id)) {
        return errorResponse("Invalid project ID", 400);
      }

      // Verify project exists
      const projectCheck = await sql`
        SELECT id FROM projects WHERE id = ${validProjectId} LIMIT 1
      `;
      if (!projectCheck.length) {
        return errorResponse("Project not found", 404);
      }
    }

    // Validate material_id if provided
    let validMaterialId = null;
    if (material_id) {
      validMaterialId = validateInteger(material_id, 1);
      if (validMaterialId !== parseInt(material_id)) {
        return errorResponse("Invalid material ID", 400);
      }

      // Verify material exists
      const materialCheck = await sql`
        SELECT id FROM materials WHERE id = ${validMaterialId} LIMIT 1
      `;
      if (!materialCheck.length) {
        return errorResponse("Material not found", 404);
      }
    }

    // Validate numeric fields
    const qty = validateNumeric(quantity, 0.01, 999999);
    const uCost = validateNumeric(unit_cost, 0, 9999999999);
    const tCost = total_cost != null ? validateNumeric(total_cost, 0, 9999999999) : qty * uCost;

    // Validate date format if provided
    if (purchase_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(purchase_date)) {
        return errorResponse("Invalid purchase_date format. Use YYYY-MM-DD", 400);
      }
    }

    // Persist UI category by prefixing description when operational and category provided
    const finalDescription =
      isOperational && category
        ? `[${String(category).toLowerCase()}] ${description.trim()}`
        : description.trim();

    const inserted = await sql`
      INSERT INTO project_costs (
        project_id, cost_type, description, material_id, quantity, unit_cost, total_cost,
        purchase_date, vendor, receipt_number, created_by, approval_status
      ) VALUES (
        ${validProjectId}, ${cost_type}, ${finalDescription}, ${validMaterialId},
        ${qty}, ${uCost}, ${tCost}, ${purchase_date}, ${vendor}, ${receipt_number}, 
        ${userId}, 'pending'
      )
      RETURNING *
    `;

    return successResponse(
      { cost: inserted[0] },
      "Expense added successfully",
      201
    );
  } catch (err) {
    console.error("POST /api/costs error", err);
    return errorResponse("Internal Server Error");
  }
}