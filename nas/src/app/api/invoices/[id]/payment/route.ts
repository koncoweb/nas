import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { z } from "zod"

// Payment schema
const paymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  payment_date: z.date().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
})

// POST /api/invoices/[id]/payment - Record payment for invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const invoiceId = parseInt(id)
    const body = await request.json()

    // Convert date string to Date object if provided
    const processedBody = {
      ...body,
      payment_date: body.payment_date ? new Date(body.payment_date) : new Date(),
    }

    // Validate input
    const validated = paymentSchema.parse(processedBody)

    // Get current invoice
    const invoiceResult = await sql`
      SELECT * FROM invoices WHERE id = ${invoiceId}
    `

    if (invoiceResult.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoiceResult[0]

    // Calculate new amount paid
    const newAmountPaid = (invoice.amount_paid || 0) + validated.amount

    // Validate payment doesn't exceed total
    if (newAmountPaid > invoice.total_amount) {
      return NextResponse.json(
        {
          error: `Payment amount exceeds remaining balance. Remaining: ${invoice.total_amount - invoice.amount_paid}`,
        },
        { status: 400 }
      )
    }

    // Determine new status
    let newStatus = invoice.status
    if (newAmountPaid >= invoice.total_amount) {
      newStatus = "paid"
    } else if (newAmountPaid > 0) {
      newStatus = "partial"
    }

    // Update invoice with payment
    const updated = await sql`
      UPDATE invoices
      SET 
        amount_paid = ${newAmountPaid},
        status = ${newStatus},
        updated_at = ${new Date()}
      WHERE id = ${invoiceId}
      RETURNING *
    `

    return NextResponse.json({
      invoice: updated[0],
      payment: {
        amount: validated.amount,
        payment_date: validated.payment_date,
        payment_method: validated.payment_method,
        notes: validated.notes,
      },
    })
  } catch (error) {
    console.error("Error recording payment:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => {
            const path = err.path.join(".")
            return `${path}: ${err.message}`
          }),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    )
  }
}

// GET /api/invoices/[id]/payment - Get payment history (if we track it separately)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const invoiceId = parseInt(id)

    // Get invoice payment info
    const invoiceResult = await sql`
      SELECT 
        id,
        invoice_number,
        total_amount,
        amount_paid,
        status,
        issue_date,
        due_date
      FROM invoices 
      WHERE id = ${invoiceId}
    `

    if (invoiceResult.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoiceResult[0]

    return NextResponse.json({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: invoice.total_amount,
      amount_paid: invoice.amount_paid,
      remaining_balance: invoice.total_amount - (invoice.amount_paid || 0),
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
    })
  } catch (error) {
    console.error("Error fetching payment info:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment info" },
      { status: 500 }
    )
  }
}
