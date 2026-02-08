import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { invoiceLineItemSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

// GET /api/invoices/[id]/line-items - Get all line items for an invoice
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

    // Get line items
    const lineItems = await sql`
      SELECT *
      FROM invoice_line_items
      WHERE invoice_id = ${invoiceId}
      ORDER BY id
    `

    return NextResponse.json(lineItems)
  } catch (error) {
    console.error("Error fetching line items:", error)
    return NextResponse.json(
      { error: "Failed to fetch line items" },
      { status: 500 }
    )
  }
}

// POST /api/invoices/[id]/line-items - Add line item to invoice
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

    // Validate input
    const validated = invoiceLineItemSchema.parse({
      ...body,
      invoice_id: invoiceId,
    })

    // Calculate line total
    const lineTotal = validated.quantity * validated.unit_price

    // Insert line item
    const [lineItem] = await sql`
      INSERT INTO invoice_line_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        line_total
      )
      VALUES (
        ${invoiceId},
        ${validated.description},
        ${validated.quantity},
        ${validated.unit_price},
        ${lineTotal}
      )
      RETURNING *
    `

    // Recalculate invoice total
    await recalculateInvoiceTotal(invoiceId)

    return NextResponse.json(lineItem, { status: 201 })
  } catch (error) {
    console.error("Error creating line item:", error)

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
      { error: "Failed to create line item" },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id]/line-items/[itemId] - Update line item
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
    const itemId = body.id

    if (!itemId) {
      return NextResponse.json(
        { error: "Line item ID is required" },
        { status: 400 }
      )
    }

    // Validate input
    const validated = invoiceLineItemSchema.parse({
      ...body,
      invoice_id: invoiceId,
    })

    // Calculate line total
    const lineTotal = validated.quantity * validated.unit_price

    // Update line item
    const updated = await sql`
      UPDATE invoice_line_items
      SET 
        description = ${validated.description},
        quantity = ${validated.quantity},
        unit_price = ${validated.unit_price},
        line_total = ${lineTotal}
      WHERE id = ${itemId} AND invoice_id = ${invoiceId}
      RETURNING *
    `

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      )
    }

    // Recalculate invoice total
    await recalculateInvoiceTotal(invoiceId)

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Error updating line item:", error)

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
      { error: "Failed to update line item" },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id]/line-items/[itemId] - Delete line item
export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json(
        { error: "Line item ID is required" },
        { status: 400 }
      )
    }

    // Delete line item
    const deleted = await sql`
      DELETE FROM invoice_line_items
      WHERE id = ${parseInt(itemId)} AND invoice_id = ${invoiceId}
      RETURNING *
    `

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      )
    }

    // Recalculate invoice total
    await recalculateInvoiceTotal(invoiceId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting line item:", error)
    return NextResponse.json(
      { error: "Failed to delete line item" },
      { status: 500 }
    )
  }
}

// Helper function to recalculate invoice total
async function recalculateInvoiceTotal(invoiceId: number): Promise<void> {
  const result = await sql`
    SELECT COALESCE(SUM(line_total), 0) as total
    FROM invoice_line_items
    WHERE invoice_id = ${invoiceId}
  `

  const total = parseFloat(result[0]?.total || "0")

  await sql`
    UPDATE invoices
    SET total_amount = ${total}
    WHERE id = ${invoiceId}
  `
}
