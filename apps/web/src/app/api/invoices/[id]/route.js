import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = parseInt(params.id);

    if (!invoiceId || isNaN(invoiceId)) {
      return Response.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    // Get invoice with related data
    const invoiceResult = await sql`
      SELECT 
        i.*,
        c.company_name as customer_name,
        c.contact_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.zip_code as customer_zip,
        p.project_number,
        p.title as project_title,
        u.name as created_by_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN auth_users u ON i.created_by = u.id
      WHERE i.id = ${invoiceId}
      LIMIT 1
    `;

    if (!invoiceResult.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceResult[0];

    // Get line items
    const lineItems = await sql`
      SELECT * FROM invoice_line_items
      WHERE invoice_id = ${invoiceId}
      ORDER BY line_order ASC
    `;

    // Get payments
    const payments = await sql`
      SELECT 
        p.*,
        u.name as created_by_name
      FROM payments p
      LEFT JOIN auth_users u ON p.created_by = u.id
      WHERE p.invoice_id = ${invoiceId}
      ORDER BY p.created_at DESC
    `;

    return Response.json({
      invoice,
      line_items: lineItems,
      payments,
    });
  } catch (err) {
    console.error("GET /api/invoices/[id] error", err);
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
    const invoiceId = parseInt(params.id);

    if (!invoiceId || isNaN(invoiceId)) {
      return Response.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    // Check permissions - leaders and accounting can update invoices
    if (!["leader", "accounting"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if invoice exists
    const existingInvoice = await sql`
      SELECT * FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `;

    if (!existingInvoice.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, due_date } = body;

    const updateFields = {};

    if (
      status &&
      ["draft", "sent", "partial", "paid", "overdue", "cancelled"].includes(
        status,
      )
    ) {
      updateFields.status = status;
    }

    if (notes !== undefined) {
      updateFields.notes = notes;
    }

    if (due_date) {
      updateFields.due_date = due_date;
    }

    updateFields.updated_at = new Date().toISOString();

    if (Object.keys(updateFields).length === 1) {
      // Only updated_at
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Build dynamic update query
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");

    const values = [invoiceId, ...Object.values(updateFields)];

    const query = `
      UPDATE invoices 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await sql(query, values);

    return Response.json({
      invoice: result[0],
      message: "Invoice updated successfully",
    });
  } catch (err) {
    console.error("PUT /api/invoices/[id] error", err);
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
    const invoiceId = parseInt(params.id);

    if (!invoiceId || isNaN(invoiceId)) {
      return Response.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    // Only leaders can delete invoices
    if (userRole !== "leader") {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if invoice exists and has no payments
    const invoiceCheck = await sql`
      SELECT i.*, COUNT(p.id) as payment_count
      FROM invoices i
      LEFT JOIN payments p ON i.id = p.invoice_id
      WHERE i.id = ${invoiceId}
      GROUP BY i.id
      LIMIT 1
    `;

    if (!invoiceCheck.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (parseInt(invoiceCheck[0].payment_count) > 0) {
      return Response.json(
        { error: "Cannot delete invoice with payments" },
        { status: 400 },
      );
    }

    // Delete invoice and related records in transaction
    await sql.transaction(async (txn) => {
      // Delete line items first (due to foreign key constraint)
      await txn`
        DELETE FROM invoice_line_items WHERE invoice_id = ${invoiceId}
      `;

      // Delete invoice
      await txn`
        DELETE FROM invoices WHERE id = ${invoiceId}
      `;
    });

    return Response.json({
      message: "Invoice deleted successfully",
    });
  } catch (err) {
    console.error("DELETE /api/invoices/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
