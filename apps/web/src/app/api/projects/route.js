import sql from "@/app/api/utils/sql.js";
import { auth } from "@/auth";
import { QueryBuilder, validatePagination, validateInteger, errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = validatePagination(
      searchParams.get("page"),
      searchParams.get("limit")
    );
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";

    const userId = session.user.id;

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    // Build query using QueryBuilder
    const qb = new QueryBuilder();
    let whereConditions = [];

    if (search) {
      whereConditions.push(qb.buildMultiLikeCondition([
        'p.project_number',
        'p.title', 
        'c.company_name'
      ], search));
    }

    if (status) {
      whereConditions.push(qb.buildEqualityCondition('p.status', status));
    }

    if (priority) {
      whereConditions.push(qb.buildEqualityCondition('p.priority', priority));
    }

    // Role-based filtering
    if (userRole === "engineer") {
      whereConditions.push(qb.buildEqualityCondition('p.assigned_engineer', userId));
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      ${whereClause}
    `;
    const countResult = await sql(countQuery, qb.getParams());
    const total = parseInt(countResult[0]?.total || 0);

    // Get projects with pagination
    const paginationClause = qb.buildPagination(limit, offset);
    const projectsQuery = `
      SELECT 
        p.*,
        c.company_name as customer_name,
        c.contact_name,
        c.email as customer_email,
        c.phone as customer_phone,
        q.quote_number,
        q.final_price as quoted_price,
        u.name as engineer_name,
        u.email as engineer_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN quotations q ON p.quotation_id = q.id
      LEFT JOIN auth_users u ON p.assigned_engineer = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      ${paginationClause}
    `;

    const projects = await sql(projectsQuery, qb.getParams());

    return successResponse({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/projects error", err);
    return errorResponse("Internal Server Error");
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Check user role - only leaders and sales can create projects
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    if (userRole !== "leader" && userRole !== "sales") {
      return errorResponse("Insufficient permissions to create projects", 403);
    }

    const body = await request.json();
    const {
      customer_id,
      quotation_id,
      title,
      description,
      assigned_engineer,
      start_date,
      expected_completion,
      priority = "medium",
    } = body;

    // Validate required fields
    if (!customer_id || !title) {
      return errorResponse("Customer and title are required", 400);
    }

    // Validate customer_id is a positive integer
    const validCustomerId = validateInteger(customer_id, 1);
    if (validCustomerId !== parseInt(customer_id)) {
      return errorResponse("Invalid customer ID", 400);
    }

    // Validate quotation_id if provided
    let validQuotationId = null;
    if (quotation_id) {
      validQuotationId = validateInteger(quotation_id, 1);
      if (validQuotationId !== parseInt(quotation_id)) {
        return errorResponse("Invalid quotation ID", 400);
      }
    }

    // Validate assigned_engineer if provided
    let validAssignedEngineer = userId; // Default to current user
    if (assigned_engineer) {
      validAssignedEngineer = validateInteger(assigned_engineer, 1);
      if (validAssignedEngineer !== parseInt(assigned_engineer)) {
        return errorResponse("Invalid assigned engineer ID", 400);
      }
    }

    // Use transaction to ensure atomic project number generation
    const result = await sql.transaction(async (tx) => {
      // Generate project number atomically
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      const lastProjectResult = await tx`
        SELECT project_number 
        FROM projects 
        WHERE project_number LIKE ${"PRJ" + yearSuffix + "%"}
        ORDER BY id DESC 
        LIMIT 1
        FOR UPDATE
      `;

      let projectNumber;
      if (lastProjectResult && lastProjectResult.length > 0) {
        const lastNumber = lastProjectResult[0].project_number;
        const lastSequence = parseInt(lastNumber.slice(-4)) || 0;
        const newSequence = (lastSequence + 1).toString().padStart(4, "0");
        projectNumber = `PRJ${yearSuffix}${newSequence}`;
      } else {
        projectNumber = `PRJ${yearSuffix}0001`;
      }

      // Verify customer exists
      const customerCheck = await tx`
        SELECT id FROM customers WHERE id = ${validCustomerId} LIMIT 1
      `;
      if (!customerCheck.length) {
        throw new Error("Customer not found");
      }

      // Verify quotation exists and belongs to customer if provided
      if (validQuotationId) {
        const quotationCheck = await tx`
          SELECT id FROM quotations 
          WHERE id = ${validQuotationId} AND customer_id = ${validCustomerId}
          LIMIT 1
        `;
        if (!quotationCheck.length) {
          throw new Error("Quotation not found or doesn't belong to this customer");
        }
      }

      // Verify assigned engineer exists if provided
      if (validAssignedEngineer !== userId) {
        const engineerCheck = await tx`
          SELECT id FROM auth_users 
          WHERE id = ${validAssignedEngineer} AND user_role IN ('engineer', 'leader')
          LIMIT 1
        `;
        if (!engineerCheck.length) {
          throw new Error("Assigned engineer not found or invalid role");
        }
      }

      // Create project
      const projectResult = await tx`
        INSERT INTO projects (
          project_number,
          customer_id,
          quotation_id,
          title,
          description,
          assigned_engineer,
          start_date,
          expected_completion,
          priority,
          status
        )
        VALUES (
          ${projectNumber},
          ${validCustomerId},
          ${validQuotationId},
          ${title.trim()},
          ${description ? description.trim() : null},
          ${validAssignedEngineer},
          ${start_date || null},
          ${expected_completion || null},
          ${priority},
          'planning'
        )
        RETURNING *
      `;

      const newProject = projectResult[0];

      // Get complete project data
      const completeProjectResult = await tx`
        SELECT 
          p.*,
          c.company_name as customer_name,
          c.contact_name,
          q.quote_number,
          u.name as engineer_name
        FROM projects p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN quotations q ON p.quotation_id = q.id
        LEFT JOIN auth_users u ON p.assigned_engineer = u.id
        WHERE p.id = ${newProject.id}
      `;

      return completeProjectResult[0];
    });

    return successResponse(
      { project: result },
      "Project created successfully",
      201
    );
  } catch (err) {
    console.error("POST /api/projects error", err);
    if (err.message?.includes('duplicate key')) {
      return errorResponse("Project number already exists. Please try again.", 409);
    }
    if (err.message?.includes('not found')) {
      return errorResponse(err.message, 404);
    }
    return errorResponse("Internal Server Error");
  }
}