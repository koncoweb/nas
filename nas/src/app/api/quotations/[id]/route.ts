import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { quotationSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/quotations/[id]
 * Get a single quotation with all related data
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

    // Fetch quotation with customer information
    const [quotation] = await sql`
      SELECT 
        q.id,
        q.quote_number,
        q.customer_id,
        q.title,
        q.description,
        q.labor_hours,
        q.labor_rate,
        q.materials_cost,
        q.labor_cost,
        q.total_cost,
        q.profit_margin,
        q.status,
        q.created_by,
        q.created_at,
        q.updated_at,
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.address
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ${quotationId}
    `

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Fetch line items
    const lineItems = await sql`
      SELECT 
        li.id,
        li.quotation_id,
        li.material_id,
        li.description,
        li.quantity,
        li.unit_price,
        li.line_total,
        m.name as material_name
      FROM quotation_line_items li
      LEFT JOIN materials m ON li.material_id = m.id
      WHERE li.quotation_id = ${quotationId}
      ORDER BY li.id ASC
    `

    // Fetch scope of work items
    const scopeWork = await sql`
      SELECT 
        id,
        quotation_id,
        step_number,
        description,
        work_category
      FROM quotation_scope_work
      WHERE quotation_id = ${quotationId}
      ORDER BY step_number ASC
    `

    return NextResponse.json({
      ...quotation,
      line_items: lineItems,
      scope_work: scopeWork,
    })
  } catch (error) {
    console.error("Failed to fetch quotation:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch quotation",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/quotations/[id]
 * Update a quotation
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

    // Check if quotation exists and get current status
    const [existing] = await sql`
      SELECT id, status FROM quotations WHERE id = ${quotationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Validate status workflow if status is being changed
    if (body.status && body.status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["sent"],
        sent: ["approved", "rejected"],
        approved: [],
        rejected: [],
      }

      const allowedNextStatuses = validTransitions[existing.status] || []
      if (!allowedNextStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${existing.status} to ${body.status}`,
            code: "INVALID_STATUS_TRANSITION",
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Validate request body (make all fields optional for updates)
    const updateSchema = quotationSchema.partial()
    const validated = updateSchema.parse(body)

    // Recalculate costs if relevant fields are updated
    let laborCost = body.labor_cost
    let totalCost = body.total_cost

    if (validated.labor_hours !== undefined || validated.labor_rate !== undefined) {
      const [current] = await sql`
        SELECT labor_hours, labor_rate, materials_cost, profit_margin 
        FROM quotations 
        WHERE id = ${quotationId}
      `
      
      const hours = validated.labor_hours ?? current.labor_hours
      const rate = validated.labor_rate ?? current.labor_rate
      const materialsCost = current.materials_cost
      const profitMargin = validated.profit_margin ?? current.profit_margin

      laborCost = hours * rate
      const subtotal = laborCost + materialsCost
      totalCost = subtotal + (subtotal * profitMargin)
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validated.customer_id !== undefined) {
      updates.push(`customer_id = $${paramIndex++}`)
      values.push(validated.customer_id)
    }
    if (validated.title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(validated.title)
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(validated.description)
    }
    if (validated.labor_hours !== undefined) {
      updates.push(`labor_hours = $${paramIndex++}`)
      values.push(validated.labor_hours)
    }
    if (validated.labor_rate !== undefined) {
      updates.push(`labor_rate = $${paramIndex++}`)
      values.push(validated.labor_rate)
    }
    if (validated.profit_margin !== undefined) {
      updates.push(`profit_margin = $${paramIndex++}`)
      values.push(validated.profit_margin)
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)
    }
    if (laborCost !== undefined) {
      updates.push(`labor_cost = $${paramIndex++}`)
      values.push(laborCost)
    }
    if (totalCost !== undefined) {
      updates.push(`total_cost = $${paramIndex++}`)
      values.push(totalCost)
    }

    updates.push(`updated_at = NOW()`)

    if (updates.length === 1) {
      // Only updated_at, nothing to update
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    values.push(quotationId)

    const [quotation] = await sql`
      UPDATE quotations
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        quote_number,
        customer_id,
        title,
        description,
        labor_hours,
        labor_rate,
        materials_cost,
        labor_cost,
        total_cost,
        profit_margin,
        status,
        created_by,
        created_at,
        updated_at
    `

    return NextResponse.json(quotation)
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

    console.error("Failed to update quotation:", error)
    return NextResponse.json(
      {
        error: "Failed to update quotation",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/quotations/[id]
 * Delete a quotation
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

    // Check if quotation exists
    const [existing] = await sql`
      SELECT id FROM quotations WHERE id = ${quotationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Check for related projects (referential integrity)
    const [project] = await sql`
      SELECT id FROM projects WHERE quotation_id = ${quotationId} LIMIT 1
    `

    if (project) {
      return NextResponse.json(
        {
          error: "Cannot delete quotation with related projects",
          code: "REFERENTIAL_INTEGRITY_VIOLATION",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete related records first (line items and scope of work)
    await sql`DELETE FROM quotation_line_items WHERE quotation_id = ${quotationId}`
    await sql`DELETE FROM quotation_scope_work WHERE quotation_id = ${quotationId}`

    // Delete the quotation
    await sql`DELETE FROM quotations WHERE id = ${quotationId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete quotation:", error)
    return NextResponse.json(
      {
        error: "Failed to delete quotation",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
