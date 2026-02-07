import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const offset = (page - 1) * limit;

    // Build query dynamically based on filters
    let countQuery = "SELECT COUNT(*) as total FROM materials WHERE 1=1";
    let materialsQuery = "SELECT * FROM materials WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (search) {
      const searchCondition = ` AND (
        LOWER(name) LIKE LOWER($${paramIndex}) OR
        LOWER(description) LIKE LOWER($${paramIndex}) OR
        LOWER(part_number) LIKE LOWER($${paramIndex})
      )`;
      countQuery += searchCondition;
      materialsQuery += searchCondition;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      const categoryCondition = ` AND category = $${paramIndex}`;
      countQuery += categoryCondition;
      materialsQuery += categoryCondition;
      params.push(category);
      paramIndex++;
    }

    // Get total count
    const countResult = await sql(countQuery, params);
    const total = parseInt(countResult[0]?.total || 0);
    const pages = Math.ceil(total / limit);

    // Get materials with pagination - Fixed parameter indexing and SQL injection
    materialsQuery += ` ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    const materials = await sql(materialsQuery, params);

    return Response.json({
      materials: materials || [],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("GET /api/materials error", err);
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

    // Check permissions - leaders, engineers, and sales can create materials
    if (!["leader", "engineer", "sales"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description = null,
      category = null,
      unit_type = "Unit",
      unit_cost = 0,
      supplier = null,
      part_number = null,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return Response.json(
        { error: "Material name is required" },
        { status: 400 },
      );
    }

    // Validate numeric fields
    const validatedUnitCost = parseFloat(unit_cost);
    if (isNaN(validatedUnitCost) || validatedUnitCost < 0) {
      return Response.json(
        { error: "Unit cost must be a valid positive number" },
        { status: 400 },
      );
    }

    // Create material
    const result = await sql`
      INSERT INTO materials (
        name, description, category, unit_type, unit_cost, supplier, part_number
      )
      VALUES (
        ${name.trim()}, ${description}, ${category}, ${unit_type}, 
        ${validatedUnitCost}, ${supplier}, ${part_number}
      )
      RETURNING *
    `;

    return Response.json({
      material: result[0],
      message: "Material created successfully",
    });
  } catch (err) {
    console.error("POST /api/materials error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}