import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { validateNumeric, errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Get user role to determine access
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    // For engineers, hide pricing information
    const selectFields =
      userRole === "engineer"
        ? `q.id, q.quote_number, q.title, q.description, q.service_type, 
         q.vessel_name, q.location, q.revision_number,
         q.time_estimation_supply, q.time_estimation_work,
         q.payment_percentage, q.payment_timing, q.validity_days, q.other_terms,
         q.status, q.valid_until, q.notes, q.created_at, q.updated_at,
         c.*, u.name as created_by_name,
         p.id as project_id, p.project_number, p.status as project_status`
        : `q.*, c.*, u.name as created_by_name, p.id as project_id, p.project_number, p.status as project_status`;

    const quotationQuery = `
      SELECT ${selectFields}
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN auth_users u ON q.created_by = u.id
      LEFT JOIN projects p ON q.id = p.quotation_id
      WHERE q.id = $1
    `;

    const result = await sql(quotationQuery, [id]);

    if (!result || result.length === 0) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }

    const quotation = result[0];

    // Get line items
    const lineItemsQuery = `
      SELECT qli.*, m.name as material_name, m.part_number, m.supplier
      FROM quotation_line_items qli
      LEFT JOIN materials m ON qli.material_id = m.id
      WHERE qli.quotation_id = $1
      ORDER BY qli.line_order
    `;

    const lineItems = await sql(lineItemsQuery, [id]);

    // Get scope of work
    const scopeWorkQuery = `
      SELECT *
      FROM quotation_scope_work
      WHERE quotation_id = $1
      ORDER BY step_number
    `;

    const scopeWork = await sql(scopeWorkQuery, [id]);

    return Response.json({
      quotation: {
        ...quotation,
        line_items: lineItems || [],
        scope_work: scopeWork || [],
      },
    });
  } catch (err) {
    console.error(`GET /api/quotations/${params.id} error`, err);
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

    // Check user role - only leaders and sales can update quotations
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    if (userRole !== "leader" && userRole !== "sales") {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      customer_id,
      title,
      description,
      service_type,
      vessel_name,
      location,
      revision_number,
      labor_hours,
      labor_rate,
      materials_cost,
      profit_margin,
      time_estimation_supply,
      time_estimation_work,
      payment_percentage,
      payment_timing,
      validity_days,
      other_terms,
      valid_until,
      notes,
      status,
      line_items = [],
      scope_work = [],
      currency: bodyCurrency,
    } = body;

    // Check if quotation exists
    const existingResult = await sql`
      SELECT * FROM quotations WHERE id = ${id}
    `;

    if (!existingResult || existingResult.length === 0) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }

    const existing = existingResult[0];

    // Helper function to validate and cap numeric values with proper bounds
    const validateQuotationNumeric = (value, fieldName, min = 0, max = 9999999999) => {
      if (value === undefined || value === null) return value;
      return validateNumeric(value, min, max);
    };

    // Helper function to validate date fields
    const validateDate = (value) => {
      if (value === undefined || value === null || value === "") return null;
      return value;
    };

    // If this is just a status update, handle it efficiently
    const isStatusOnlyUpdate =
      Object.keys(body).length === 1 && status !== undefined;

    if (isStatusOnlyUpdate) {
      const validStatuses = [
        "draft",
        "sent",
        "approved",
        "rejected",
        "expired",
      ];
      if (!validStatuses.includes(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }

      const result = await sql`
        UPDATE quotations 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      return Response.json({ quotation: result[0] });
    }

    // Build update fields dynamically for full updates
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (customer_id !== undefined) {
      updates.push(`customer_id = $${paramIndex++}`);
      values.push(customer_id);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (service_type !== undefined) {
      updates.push(`service_type = $${paramIndex++}`);
      values.push(service_type);
    }
    if (vessel_name !== undefined) {
      updates.push(`vessel_name = $${paramIndex++}`);
      values.push(vessel_name);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(location);
    }
    if (revision_number !== undefined) {
      updates.push(`revision_number = $${paramIndex++}`);
      values.push(revision_number);
    }
    if (labor_hours !== undefined) {
      updates.push(`labor_hours = $${paramIndex++}`);
      values.push(validateNumeric(labor_hours, "labor_hours"));
    }
    if (labor_rate !== undefined) {
      updates.push(`labor_rate = $${paramIndex++}`);
      values.push(validateNumeric(labor_rate, "labor_rate"));
    }
    if (materials_cost !== undefined) {
      updates.push(`materials_cost = $${paramIndex++}`);
      values.push(validateNumeric(materials_cost, "materials_cost"));
    }
    if (profit_margin !== undefined) {
      updates.push(`profit_margin = $${paramIndex++}`);
      values.push(validateNumeric(profit_margin, "profit_margin", 100));
    }
    if (time_estimation_supply !== undefined) {
      updates.push(`time_estimation_supply = $${paramIndex++}`);
      values.push(time_estimation_supply);
    }
    if (time_estimation_work !== undefined) {
      updates.push(`time_estimation_work = $${paramIndex++}`);
      values.push(time_estimation_work);
    }
    if (payment_percentage !== undefined) {
      updates.push(`payment_percentage = $${paramIndex++}`);
      values.push(
        validateNumeric(payment_percentage, "payment_percentage", 100),
      );
    }
    if (payment_timing !== undefined) {
      updates.push(`payment_timing = $${paramIndex++}`);
      values.push(payment_timing);
    }
    if (validity_days !== undefined) {
      updates.push(`validity_days = $${paramIndex++}`);
      values.push(parseInt(validity_days) || 7);
    }
    if (other_terms !== undefined) {
      updates.push(`other_terms = $${paramIndex++}`);
      values.push(other_terms);
    }
    if (valid_until !== undefined) {
      updates.push(`valid_until = $${paramIndex++}`);
      values.push(validateDate(valid_until));
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    if (status !== undefined) {
      const validStatuses = [
        "draft",
        "sent",
        "approved",
        "rejected",
        "expired",
      ];
      if (validStatuses.includes(status)) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
    }
    // NEW: allow updating currency (IDR, USD, SGD)
    if (bodyCurrency !== undefined) {
      const allowed = ["IDR", "USD", "SGD"];
      const safe =
        typeof bodyCurrency === "string" &&
        allowed.includes(bodyCurrency.toUpperCase())
          ? bodyCurrency.toUpperCase()
          : "IDR";
      updates.push(`currency = $${paramIndex++}`);
      values.push(safe);
    }

    // Calculate costs from line items if provided
    let total_materials_cost = 0;
    if (line_items && line_items.length > 0) {
      for (const item of line_items) {
        const quantity = validateNumeric(
          item.quantity,
          "item.quantity",
          999999999,
        );
        const unitPrice = validateNumeric(
          item.unit_price,
          "item.unit_price",
          999999999,
        );
        total_materials_cost += quantity * unitPrice;
      }
    } else {
      // Use existing materials cost if no line items provided
      total_materials_cost = existing.materials_cost || 0;
    }

    // Recalculate costs if relevant fields changed
    const newLaborHours =
      labor_hours !== undefined
        ? validateNumeric(labor_hours, "labor_hours")
        : existing.labor_hours || 0;
    const newLaborRate =
      labor_rate !== undefined
        ? validateNumeric(labor_rate, "labor_rate")
        : existing.labor_rate || 0;
    const newMaterialsCost =
      materials_cost !== undefined
        ? validateNumeric(materials_cost, "materials_cost")
        : total_materials_cost;
    const newProfitMargin =
      profit_margin !== undefined
        ? validateNumeric(profit_margin, "profit_margin", 100)
        : existing.profit_margin || 0;

    const newLaborCost = validateNumeric(
      newLaborHours * newLaborRate,
      "labor_cost",
    );
    const newTotalCost = validateNumeric(
      newLaborCost + newMaterialsCost,
      "total_cost",
    );
    const newProfitAmount = validateNumeric(
      newTotalCost * (newProfitMargin / 100),
      "profit_amount",
    );
    const newFinalPrice = validateNumeric(
      newTotalCost + newProfitAmount,
      "final_price",
    );

    updates.push(`labor_cost = $${paramIndex++}`);
    values.push(newLaborCost);
    updates.push(`total_cost = $${paramIndex++}`);
    values.push(newTotalCost);
    updates.push(`final_price = $${paramIndex++}`);
    values.push(newFinalPrice);

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only the timestamp update
      return Response.json({ quotation: existing });
    }

    const updateQuery = `
      UPDATE quotations 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const quotationResult = await sql(updateQuery, values);
    const result = quotationResult[0];

    // Update line items if provided
    if (line_items && line_items.length >= 0) {
      // Delete existing line items
      await sql`DELETE FROM quotation_line_items WHERE quotation_id = ${id}`;

      // Insert new line items (now including scope_group)
      for (let i = 0; i < line_items.length; i++) {
        const item = line_items[i];
        const quantity =
          validateNumeric(item.quantity, "item.quantity", 999999999) || 1;
        const unitPrice =
          validateNumeric(item.unit_price, "item.unit_price", 999999999) || 0;
        const lineTotal = validateNumeric(quantity * unitPrice, "line_total");

        await sql`
          INSERT INTO quotation_line_items (
            quotation_id, material_id, description, quantity, unit_type, 
            unit_price, line_total, line_order, item_type, scope_group
          )
          VALUES (
            ${id}, ${item.material_id || null}, ${item.description},
            ${quantity}, ${item.unit_type || "Unit"}, 
            ${unitPrice}, ${lineTotal}, ${i + 1}, ${item.item_type || "material"}, ${item.scope_group || null}
          )
        `;
      }
    }

    // Update scope of work if provided
    if (scope_work && scope_work.length >= 0) {
      // Delete existing scope work
      await sql`DELETE FROM quotation_scope_work WHERE quotation_id = ${id}`;

      // Insert new scope work
      for (let i = 0; i < scope_work.length; i++) {
        const work = scope_work[i];
        const estimatedHours =
          validateNumeric(work.estimated_hours, "estimated_hours", 999999999) ||
          0;

        await sql`
          INSERT INTO quotation_scope_work (
            quotation_id, step_number, description, work_category, estimated_hours
          )
          VALUES (
            ${id}, ${i + 1}, ${work.description},
            ${work.work_category || null}, ${estimatedHours}
          )
        `;
      }
    }

    return Response.json({ quotation: result });
  } catch (err) {
    console.error(`PUT /api/quotations/${params.id} error`, err);
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

    // Check user role - only leaders and sales can delete quotations
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    if (userRole !== "leader" && userRole !== "sales") {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Check if quotation exists and if it has related projects
    const existingResult = await sql`
      SELECT q.*, COUNT(p.id) as project_count
      FROM quotations q
      LEFT JOIN projects p ON q.id = p.quotation_id
      WHERE q.id = ${id}
      GROUP BY q.id
    `;

    if (!existingResult || existingResult.length === 0) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }

    const quotation = existingResult[0];

    // Prevent deletion if there are related projects
    if (quotation.project_count > 0) {
      return Response.json(
        {
          error: "Cannot delete quotation with associated projects",
        },
        { status: 400 },
      );
    }

    // Delete the quotation
    await sql`DELETE FROM quotations WHERE id = ${id}`;

    return Response.json({ message: "Quotation deleted successfully" });
  } catch (err) {
    console.error(`DELETE /api/quotations/${params.id} error`, err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
