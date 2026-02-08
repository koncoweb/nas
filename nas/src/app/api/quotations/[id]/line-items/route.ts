import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { quotationLineItemSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/quotations/[id]/line-items
 * Get all line items for a quotation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const quotationId = parseInt(id)

    const lineItems = await sql`
      SELECT 
        li.id,
        li.quotation_id,
        li.material_id,
        li.description,
        li.quantity,
        li.unit_price,
        li.line_total,
        m.name as material_name,
        m.unit_type
      FROM quotation_line_items li
      LEFT JOIN materials m ON li.material_id = m.id
      WHERE li.quotation_id = ${quotationId}
      ORDER BY li.id ASC
    `

    return NextResponse.json({ data: lineItems })
  } catch (error) {
    console.error("Failed to fetch line items:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch line items",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quotations/[id]/line-items
 * Add a line item to a quotation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const quotationId = parseInt(id)
    const body = await request.json()

    // Check if quotation exists
    const [quotation] = await sql`
      SELECT id, status FROM quotations WHERE id = ${quotationId}
    `

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Validate request body
    const validated = quotationLineItemSchema.parse({
      ...body,
      quotation_id: quotationId,
    })

    // Calculate line total
    const lineTotal = validated.quantity * validated.unit_price

    // Insert line item
    const [lineItem] = await sql`
      INSERT INTO quotation_line_items (
        quotation_id,
        material_id,
        description,
        quantity,
        unit_price,
        line_total
      )
      VALUES (
        ${quotationId},
        ${validated.material_id || null},
        ${validated.description},
        ${validated.quantity},
        ${validated.unit_price},
        ${lineTotal}
      )
      RETURNING 
        id,
        quotation_id,
        material_id,
        description,
        quantity,
        unit_price,
        line_total
    `

    // Recalculate quotation totals
    await recalculateQuotationTotals(quotationId)

    return NextResponse.json(lineItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(error),
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.error("Failed to create line item:", error)
    return NextResponse.json(
      {
        error: "Failed to create line item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/quotations/[id]/line-items
 * Update a line item (expects line_item_id in body)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const quotationId = parseInt(id)
    const body = await request.json()

    if (!body.line_item_id) {
      return NextResponse.json(
        { error: "line_item_id is required" },
        { status: 400 }
      )
    }

    const lineItemId = parseInt(body.line_item_id)

    // Check if line item exists and belongs to this quotation
    const [existing] = await sql`
      SELECT id FROM quotation_line_items 
      WHERE id = ${lineItemId} AND quotation_id = ${quotationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      )
    }

    // Validate request body (make fields optional for updates)
    const updateSchema = quotationLineItemSchema.partial().extend({
      line_item_id: z.number(),
    })
    const validated = updateSchema.parse(body)

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validated.material_id !== undefined) {
      updates.push(`material_id = $${paramIndex++}`)
      values.push(validated.material_id)
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(validated.description)
    }
    if (validated.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`)
      values.push(validated.quantity)
    }
    if (validated.unit_price !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`)
      values.push(validated.unit_price)
    }

    // Recalculate line total if quantity or unit_price changed
    if (validated.quantity !== undefined || validated.unit_price !== undefined) {
      const [current] = await sql`
        SELECT quantity, unit_price FROM quotation_line_items WHERE id = ${lineItemId}
      `
      const quantity = validated.quantity ?? current.quantity
      const unitPrice = validated.unit_price ?? current.unit_price
      const lineTotal = quantity * unitPrice

      updates.push(`line_total = $${paramIndex++}`)
      values.push(lineTotal)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    values.push(lineItemId)

    const [lineItem] = await sql`
      UPDATE quotation_line_items
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        quotation_id,
        material_id,
        description,
        quantity,
        unit_price,
        line_total
    `

    // Recalculate quotation totals
    await recalculateQuotationTotals(quotationId)

    return NextResponse.json(lineItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(error),
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.error("Failed to update line item:", error)
    return NextResponse.json(
      {
        error: "Failed to update line item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/quotations/[id]/line-items
 * Delete a line item (expects line_item_id in query params)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const quotationId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const lineItemId = searchParams.get("line_item_id")

    if (!lineItemId) {
      return NextResponse.json(
        { error: "line_item_id query parameter is required" },
        { status: 400 }
      )
    }

    // Check if line item exists and belongs to this quotation
    const [existing] = await sql`
      SELECT id FROM quotation_line_items 
      WHERE id = ${parseInt(lineItemId)} AND quotation_id = ${quotationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      )
    }

    // Delete the line item
    await sql`DELETE FROM quotation_line_items WHERE id = ${parseInt(lineItemId)}`

    // Recalculate quotation totals
    await recalculateQuotationTotals(quotationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete line item:", error)
    return NextResponse.json(
      {
        error: "Failed to delete line item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to recalculate quotation totals
 */
async function recalculateQuotationTotals(quotationId: number) {
  // Get sum of all line items
  const [{ total }] = await sql`
    SELECT COALESCE(SUM(line_total), 0) as total
    FROM quotation_line_items
    WHERE quotation_id = ${quotationId}
  `

  const materialsCost = parseFloat(total as string)

  // Get current quotation data
  const [quotation] = await sql`
    SELECT labor_hours, labor_rate, profit_margin
    FROM quotations
    WHERE id = ${quotationId}
  `

  const laborCost = quotation.labor_hours * quotation.labor_rate
  const subtotal = laborCost + materialsCost
  const totalCost = subtotal + (subtotal * quotation.profit_margin)

  // Update quotation
  await sql`
    UPDATE quotations
    SET 
      materials_cost = ${materialsCost},
      labor_cost = ${laborCost},
      total_cost = ${totalCost},
      updated_at = NOW()
    WHERE id = ${quotationId}
  `
}
