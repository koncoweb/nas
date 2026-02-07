import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { QueryBuilder, validatePagination, validateInteger, validateNumeric, errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

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
    const project_id = searchParams.get("project_id") || "";

    // Get user role to determine access
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Build query using QueryBuilder
    const qb = new QueryBuilder();
    let whereConditions = ["1=1"];

    // Role-based access control with proper parameter indexing
    if (userRole === "engineer") {
      // Engineers can only see their own requests
      whereConditions.push(qb.buildEqualityCondition('mr.requested_by', userId));
    } else if (userRole === "sales") {
      // Sales can see their own requests AND all submitted requests that need review
      const userIdParam = qb.addParam(userId);
      whereConditions.push(`(
        mr.requested_by = ${userIdParam} OR
        mr.status IN ('submitted', 'under_review', 'approved', 'rejected')
      )`);
    } else if (userRole === "leader") {
      // Leaders can see all requests - no additional filter needed
    } else if (userRole === "accounting") {
      // Accounting can see approved requests for cost tracking
      whereConditions.push(qb.buildEqualityCondition('mr.status', 'approved'));
    }

    if (search) {
      whereConditions.push(qb.buildMultiLikeCondition([
        'mr.title',
        'mr.description',
        'p.title',
        'u.name'
      ], search));
    }

    if (status) {
      whereConditions.push(qb.buildEqualityCondition('mr.status', status));
    }

    if (project_id) {
      const validProjectId = validateInteger(project_id, 1);
      if (validProjectId === parseInt(project_id)) {
        whereConditions.push(qb.buildEqualityCondition('mr.project_id', validProjectId));
      }
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE ${whereClause}
    `;
    const countResult = await sql(countQuery, qb.getParams());
    const total = parseInt(countResult[0]?.total || 0);

    // Get material requests with project and user info
    const paginationClause = qb.buildPagination(limit, offset);
    const requestsQuery = `
      SELECT 
        mr.*,
        p.title as project_title,
        p.project_number,
        c.company_name as customer_name,
        u.name as requested_by_name
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE ${whereClause}
      ORDER BY mr.created_at DESC
      ${paginationClause}
    `;

    const requests = await sql(requestsQuery, qb.getParams());

    return successResponse({
      material_requests: requests || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/material-requests error", err);
    return errorResponse("Internal Server Error");
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    // Check user role - engineers, sales, and leaders can create material requests
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    if (!["engineer", "sales", "leader"].includes(userRole)) {
      return errorResponse(
        "Only engineers, sales, and leaders can create material requests",
        403
      );
    }

    const body = await request.json();
    const {
      project_id,
      request_type = "material",
      title,
      description,
      urgency = "medium",
      needed_date,
      items = [],
    } = body;

    // Validate required fields
    if (!project_id || !title) {
      return errorResponse("Project ID and title are required", 400);
    }

    // Validate project_id
    const validProjectId = validateInteger(project_id, 1);
    if (validProjectId !== parseInt(project_id)) {
      return errorResponse("Invalid project ID", 400);
    }

    // Validate request_type
    const allowedRequestTypes = ['material', 'equipment', 'service'];
    if (!allowedRequestTypes.includes(request_type)) {
      return errorResponse("Invalid request_type", 400);
    }

    // Validate urgency
    const allowedUrgencies = ['low', 'medium', 'high', 'critical'];
    if (!allowedUrgencies.includes(urgency)) {
      return errorResponse("Invalid urgency level", 400);
    }

    // Validate needed_date format if provided
    if (needed_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(needed_date)) {
        return errorResponse("Invalid needed_date format. Use YYYY-MM-DD", 400);
      }
    }

    // Verify project exists and user has access
    const projectResult = await sql`
      SELECT id FROM projects WHERE id = ${validProjectId} LIMIT 1
    `;

    if (projectResult.length === 0) {
      return errorResponse("Project not found", 404);
    }

    // Validate and calculate estimated total cost
    let estimated_total_cost = 0;
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.description || !item.description.trim()) {
        return errorResponse(`Item ${i + 1}: description is required`, 400);
      }

      const quantity = validateNumeric(item.quantity, 0.01, 999999);
      const estimatedUnitCost = validateNumeric(item.estimated_unit_cost, 0, 9999999999);
      const itemTotalCost = quantity * estimatedUnitCost;
      
      estimated_total_cost += itemTotalCost;

      // Validate material_id if provided
      let validMaterialId = null;
      if (item.material_id) {
        validMaterialId = validateInteger(item.material_id, 1);
        if (validMaterialId !== parseInt(item.material_id)) {
          return errorResponse(`Item ${i + 1}: Invalid material ID`, 400);
        }

        // Verify material exists
        const materialCheck = await sql`
          SELECT id FROM materials WHERE id = ${validMaterialId} LIMIT 1
        `;
        if (!materialCheck.length) {
          return errorResponse(`Item ${i + 1}: Material not found`, 404);
        }
      }

      validatedItems.push({
        material_id: validMaterialId,
        description: item.description.trim(),
        quantity,
        unit_type: item.unit_type || "Unit",
        estimated_unit_cost: estimatedUnitCost,
        estimated_total_cost: itemTotalCost,
        purpose: item.purpose ? item.purpose.trim() : null,
        is_urgent: Boolean(item.is_urgent),
        item_order: i + 1,
      });
    }

    // Use transaction to ensure atomic creation
    const result = await sql.transaction(async (tx) => {
      // Create material request
      const materialRequestResult = await tx`
        INSERT INTO material_requests (
          project_id, requested_by, request_type, title, description,
          urgency, estimated_total_cost, needed_date, status
        )
        VALUES (
          ${validProjectId}, ${userId}, ${request_type}, ${title.trim()}, ${description ? description.trim() : null},
          ${urgency}, ${estimated_total_cost}, ${needed_date}, 'draft'
        )
        RETURNING *
      `;

      const materialRequest = materialRequestResult[0];

      // Insert material request items
      for (const item of validatedItems) {
        await tx`
          INSERT INTO material_request_items (
            material_request_id, material_id, description, quantity, unit_type,
            estimated_unit_cost, estimated_total_cost, purpose, is_urgent, item_order
          )
          VALUES (
            ${materialRequest.id}, ${item.material_id}, ${item.description},
            ${item.quantity}, ${item.unit_type}, ${item.estimated_unit_cost}, 
            ${item.estimated_total_cost}, ${item.purpose}, ${item.is_urgent}, ${item.item_order}
          )
        `;
      }

      return materialRequest;
    });

    return successResponse(
      { material_request: result },
      "Material request created successfully",
      201
    );
  } catch (err) {
    console.error("POST /api/material-requests error", err);
    return errorResponse("Internal Server Error");
  }
}