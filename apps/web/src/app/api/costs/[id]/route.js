import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (!id) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const userId = session.user.id;
    const roleRes =
      await sql`SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1`;
    const role = roleRes[0]?.user_role || "sales";

    // Align edit policy with create: only leader, engineer, accounting can update
    if (!["leader", "engineer", "accounting"].includes(role)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Fetch current cost for ownership checks
    const currentRows = await sql`
      SELECT id, created_by FROM project_costs WHERE id = ${id} LIMIT 1
    `;
    if (!currentRows.length) {
      return Response.json({ error: "Cost not found" }, { status: 404 });
    }
    const current = currentRows[0];

    // Engineers may only edit costs they created; leaders/accounting can edit any
    if (role === "engineer" && current.created_by !== userId) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      cost_type,
      description,
      material_id,
      quantity,
      unit_cost,
      total_cost,
      purchase_date,
      vendor,
      receipt_number,
      approval_status,
      approved_by,
    } = body;

    // Dynamic SET builder
    const sets = [];
    const values = [];

    if (cost_type !== undefined) {
      sets.push(`cost_type = $${values.length + 1}`);
      values.push(cost_type);
    }
    if (description !== undefined) {
      sets.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (material_id !== undefined) {
      sets.push(`material_id = $${values.length + 1}`);
      values.push(material_id ? parseInt(material_id) : null);
    }
    if (quantity !== undefined) {
      sets.push(`quantity = $${values.length + 1}`);
      values.push(parseFloat(quantity || 0));
    }
    if (unit_cost !== undefined) {
      sets.push(`unit_cost = $${values.length + 1}`);
      values.push(parseFloat(unit_cost || 0));
    }
    if (total_cost !== undefined) {
      sets.push(`total_cost = $${values.length + 1}`);
      values.push(parseFloat(total_cost || 0));
    }
    if (purchase_date !== undefined) {
      sets.push(`purchase_date = $${values.length + 1}`);
      values.push(purchase_date);
    }
    if (vendor !== undefined) {
      sets.push(`vendor = $${values.length + 1}`);
      values.push(vendor);
    }
    if (receipt_number !== undefined) {
      sets.push(`receipt_number = $${values.length + 1}`);
      values.push(receipt_number);
    }

    // Approval updates require leader/accounting
    if (approval_status !== undefined) {
      if (!["leader", "accounting"].includes(role)) {
        return Response.json(
          { error: "Permission denied to change approval status" },
          { status: 403 },
        );
      }
      sets.push(`approval_status = $${values.length + 1}`);
      values.push(approval_status);
      if (approval_status === "approved") {
        sets.push(`approved_by = $${values.length + 1}`);
        values.push(userId);
        sets.push(`approved_at = CURRENT_TIMESTAMP`);
      }
    }

    if (sets.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const sqlStr = `UPDATE project_costs SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} RETURNING *`;
    const rows = await sql(sqlStr, [...values, id]);

    if (!rows.length) {
      return Response.json({ error: "Cost not found" }, { status: 404 });
    }

    return Response.json({ cost: rows[0], message: "Cost updated" });
  } catch (err) {
    console.error("PUT /api/costs/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
