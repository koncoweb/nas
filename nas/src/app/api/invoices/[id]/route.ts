import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { formatZodErrors } from "@/lib/validations"
import { z } from "zod"

// GET /api/invoices/[id] - Get single invoice with line items
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

    // Get invoice with customer and project info
    const invoiceResult = await sql`
      SELECT 
        i.*,
        c.company_name as customer_name,
        c.contact_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        p.project_number,
        p.title as project_title
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ${invoiceId}
    `

    if (invoiceResult.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoiceResult[0]

    // Get line items
    const lineItems = await sql`
      SELECT *
      FROM invoice_line_items
      WHERE invoice_id = ${invoiceId}
      ORDER BY id
    `

    return NextResponse.json({
      ...invoice,
      line_items: lineItems,
    })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
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

    // Check if invoice exists
    const existingResult = await sql`
      SELECT * FROM invoices WHERE id = ${invoiceId}
    `

    if (existingResult.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const existing = existingResult[0]

    // Validate status transition if status is being updated
    if (body.status && body.status !== existing.status) {
      const validTransition = isValidStatusTransition(existing.status, body.status)
      if (!validTransition) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${existing.status} to ${body.status}`,
          },
          { status: 400 }
        )
      }
    }

    // Build update fields with parameterized values
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.issue_date !== undefined) {
      updates.push(`issue_date = $${paramIndex++}`)
      values.push(new Date(body.issue_date))
    }

    if (body.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`)
      values.push(new Date(body.due_date))
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)
    }

    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`)
      values.push(body.notes)
    }

    if (body.amount_paid !== undefined) {
      updates.push(`amount_paid = $${paramIndex++}`)
      values.push(body.amount_paid)

      // Update status based on payment
      if (body.amount_paid >= existing.total_amount) {
        updates.push(`status = $${paramIndex++}`)
        values.push("paid")
      } else if (body.amount_paid > 0) {
        updates.push(`status = $${paramIndex++}`)
        values.push("partial")
      }
    }

    updates.push(`updated_at = NOW()`)

    if (updates.length === 1) {
      // Only updated_at, nothing to update
      return NextResponse.json(existing)
    }

    values.push(invoiceId)

    // Update invoice
    const [updated] = await sql`
      UPDATE invoices
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating invoice:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(error),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    )
  }
}

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    draft: ["sent"],
    sent: ["partial", "paid"],
    partial: ["paid"],
    paid: [], // Terminal state
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false
}
