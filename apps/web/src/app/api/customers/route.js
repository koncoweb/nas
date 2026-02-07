import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { QueryBuilder, validatePagination, errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

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

    // Build query using QueryBuilder for safe parameter indexing
    const qb = new QueryBuilder();
    const whereParts = ["1=1"];

    if (search) {
      whereParts.push(qb.buildMultiLikeCondition([
        'company_name',
        'contact_name',
        'email',
        'phone'
      ], search));
    }

    const where = whereParts.join(" AND ");

    // Get total count
    const countSql = `SELECT COUNT(*)::int AS total FROM customers WHERE ${where}`;
    const countResult = await sql(countSql, qb.getParams());
    const total = countResult[0]?.total || 0;

    // Get customers with pagination
    const paginationClause = qb.buildPagination(limit, offset);
    const listSql = `
      SELECT * FROM customers 
      WHERE ${where}
      ORDER BY company_name ASC
      ${paginationClause}
    `;
    const customers = await sql(listSql, qb.getParams());

    return successResponse({
      customers: customers || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/customers error", err);
    return errorResponse("Internal Server Error");
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    // Check user role - only leaders and sales can create customers
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    if (!["leader", "sales"].includes(userRole)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();
    const {
      company_name,
      contact_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
    } = body;

    // Validate required fields
    if (!company_name || !company_name.trim()) {
      return errorResponse("Company name is required", 400);
    }

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return errorResponse("Invalid email format", 400);
      }
    }

    // Validate phone format if provided (basic validation)
    if (phone && phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
      if (!phoneRegex.test(phone.trim())) {
        return errorResponse("Invalid phone format", 400);
      }
    }

    const result = await sql`
      INSERT INTO customers (
        company_name, contact_name, email, phone, address, city, state, zip_code
      )
      VALUES (
        ${company_name.trim()}, ${contact_name ? contact_name.trim() : null}, 
        ${email ? email.trim() : null}, ${phone ? phone.trim() : null}, 
        ${address ? address.trim() : null}, ${city ? city.trim() : null}, 
        ${state ? state.trim() : null}, ${zip_code ? zip_code.trim() : null}
      )
      RETURNING *
    `;

    return successResponse(
      { customer: result[0] },
      "Customer created successfully",
      201
    );
  } catch (err) {
    console.error("POST /api/customers error", err);
    if (err.message?.includes('duplicate key')) {
      return errorResponse("Customer with this email already exists", 409);
    }
    return errorResponse("Internal Server Error");
  }
}