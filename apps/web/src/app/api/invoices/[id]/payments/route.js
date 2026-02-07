import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
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

    // Check permissions - leaders and accounting can add payments
    if (!["leader", "accounting"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      amount,
      payment_method = "check",
      reference_number = null,
      notes = null,
      payment_date = null,
    } = body;

    // Validate required fields
    if (!amount || parseFloat(amount) <= 0) {
      return Response.json(
        { error: "Valid payment amount is required" },
        { status: 400 },
      );
    }

    // Get invoice details
    const invoiceResult = await sql`
      SELECT * FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `;

    if (!invoiceResult.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceResult[0];

    // Check if invoice is cancelled
    if (invoice.status === "cancelled") {
      return Response.json(
        { error: "Cannot add payment to cancelled invoice" },
        { status: 400 },
      );
    }

    // Check if payment amount exceeds balance due
    const currentBalance = parseFloat(invoice.balance_due || 0);
    const paymentAmount = parseFloat(amount);

    if (paymentAmount > currentBalance) {
      return Response.json(
        {
          error: `Payment amount ($${paymentAmount.toFixed(2)}) exceeds balance due ($${currentBalance.toFixed(2)})`,
        },
        { status: 400 },
      );
    }

    // Use today's date if no payment date provided
    const effectivePaymentDate =
      payment_date || new Date().toISOString().split("T")[0];

    // Insert payment
    const paymentResult = await sql`
      INSERT INTO payments (
        invoice_id, amount, payment_date, payment_method, 
        reference_number, notes, created_by
      )
      VALUES (
        ${invoiceId}, ${paymentAmount.toFixed(2)}, ${effectivePaymentDate},
        ${payment_method}, ${reference_number}, ${notes}, ${userId}
      )
      RETURNING *
    `;

    // Calculate new amounts
    const currentAmountPaid = parseFloat(invoice.amount_paid || 0);
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const totalAmount = parseFloat(invoice.total_amount || 0);
    const newBalanceDue = totalAmount - newAmountPaid;

    // Determine new status
    let newStatus = invoice.status;
    if (newBalanceDue <= 0) {
      newStatus = "paid";
    } else if (newAmountPaid > 0 && invoice.status === "draft") {
      newStatus = "partial";
    } else if (newAmountPaid > 0 && invoice.status !== "paid") {
      newStatus = "partial";
    }

    // Update invoice
    const updatedInvoiceResult = await sql`
      UPDATE invoices 
      SET 
        amount_paid = ${newAmountPaid.toFixed(2)},
        balance_due = ${Math.max(0, newBalanceDue).toFixed(2)},
        status = ${newStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoiceId}
      RETURNING *
    `;

    return Response.json({
      payment: paymentResult[0],
      invoice: updatedInvoiceResult[0],
      message: "Payment added successfully",
    });
  } catch (err) {
    console.error("POST /api/invoices/[id]/payments error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    // Check if invoice exists
    const invoiceCheck = await sql`
      SELECT id FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `;

    if (!invoiceCheck.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get all payments for this invoice
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
      payments: payments || [],
    });
  } catch (err) {
    console.error("GET /api/invoices/[id]/payments error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
