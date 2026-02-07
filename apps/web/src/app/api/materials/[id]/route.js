import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const result = await sql`
      SELECT * FROM materials WHERE id = ${id} LIMIT 1
    `;

    if (result.length === 0) {
      return Response.json({ error: "Material not found" }, { status: 404 });
    }

    return Response.json({ material: result[0] });
  } catch (err) {
    console.error("GET /api/materials/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Check permissions - leaders, engineers, and sales can update materials
    if (!["leader", "engineer", "sales"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if material exists
    const existingResult = await sql`
      SELECT * FROM materials WHERE id = ${id} LIMIT 1
    `;

    if (existingResult.length === 0) {
      return Response.json({ error: "Material not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      unit_type,
      unit_cost,
      supplier,
      part_number,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return Response.json(
        { error: "Material name is required" },
        { status: 400 },
      );
    }

    // Update material
    const result = await sql`
      UPDATE materials 
      SET 
        name = ${name.trim()},
        description = ${description || null},
        category = ${category || null},
        unit_type = ${unit_type || "Unit"},
        unit_cost = ${parseFloat(unit_cost) || 0},
        supplier = ${supplier || null},
        part_number = ${part_number || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json({
      material: result[0],
      message: "Material updated successfully",
    });
  } catch (err) {
    console.error("PUT /api/materials/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Check permissions - only leaders can delete materials
    if (userRole !== "leader") {
      return Response.json(
        { error: "Only leaders can delete materials" },
        { status: 403 },
      );
    }

    // Check if material exists
    const existingResult = await sql`
      SELECT * FROM materials WHERE id = ${id} LIMIT 1
    `;

    if (existingResult.length === 0) {
      return Response.json({ error: "Material not found" }, { status: 404 });
    }

    // Check if material is used in any material requests or quotations
    const usageCheck = await sql`
      SELECT 
        (SELECT COUNT(*) FROM material_request_items WHERE material_id = ${id}) as request_usage,
        (SELECT COUNT(*) FROM quotation_line_items WHERE material_id = ${id}) as quotation_usage
    `;

    const totalUsage =
      parseInt(usageCheck[0]?.request_usage || 0) +
      parseInt(usageCheck[0]?.quotation_usage || 0);

    if (totalUsage > 0) {
      return Response.json(
        {
          error:
            "Cannot delete material that is referenced in material requests or quotations",
        },
        { status: 400 },
      );
    }

    // Delete material
    await sql`DELETE FROM materials WHERE id = ${id}`;

    return Response.json({ message: "Material deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/materials/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
