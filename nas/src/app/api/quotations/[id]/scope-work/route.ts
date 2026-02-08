import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { quotationScopeWorkSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/quotations/[id]/scope-work
 * Get all scope of work items for a quotation
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

    return NextResponse.json({ data: scopeWork })
  } catch (error) {
    console.error("Failed to fetch scope of work:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch scope of work",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quotations/[id]/scope-work
 * Add a scope of work item to a quotation
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
      SELECT id FROM quotations WHERE id = ${quotationId}
    `

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Validate request body
    const validated = quotationScopeWorkSchema.parse({
      ...body,
      quotation_id: quotationId,
    })

    // Insert scope of work item
    const [scopeWorkItem] = await sql`
      INSERT INTO quotation_scope_work (
        quotation_id,
        step_number,
        description,
        work_category
      )
      VALUES (
        ${quotationId},
        ${validated.step_number},
        ${validated.description},
        ${validated.work_category || null}
      )
      RETURNING 
        id,
        quotation_id,
        step_number,
        description,
        work_category
    `

    return NextResponse.json(scopeWorkItem, { status: 201 })
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

    console.error("Failed to create scope of work item:", error)
    return NextResponse.json(
      {
        error: "Failed to create scope of work item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/quotations/[id]/scope-work
 * Update a scope of work item (expects scope_work_id in body)
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

    if (!body.scope_work_id) {
      return NextResponse.json(
        { error: "scope_work_id is required" },
        { status: 400 }
      )
    }

    const scopeWorkId = parseInt(body.scope_work_id)

    // Check if scope of work item exists and belongs to this quotation
    const [existing] = await sql`
      SELECT id FROM quotation_scope_work 
      WHERE id = ${scopeWorkId} AND quotation_id = ${quotationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Scope of work item not found" },
        { status: 404 }
      )
    }

    // Validate request body (make fields optional for updates)
    const updateSchema = quotationScopeWorkSchema.partial().extend({
      scope_work_id: z.number(),
    })
    const validated = updateSchema.parse(body)

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validated.step_number !== undefined) {
      updates.push(`step_number = $${paramIndex++}`)
      values.push(validated.step_number)
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(validated.description)
    }
    if (validated.work_category !== undefined) {
      updates.push(`work_category = $${paramIndex++}`)
      values.push(validated.work_category)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    values.push(scopeWorkId)

    const [scopeWorkItem] = await sql`
      UPDATE quotation_scope_work
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        quotation_id,
        step_number,
        description,
        work_category
    `

    return NextResponse.json(scopeWorkItem)
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

    console.error("Failed to update scope of work item:", error)
    return NextResponse.json(
      {
        error: "Failed to update scope of work item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/quotations/[id]/scope-work
 * Delete a scope of work item (expects scope_work_id in query params)
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
    const scopeWorkId = searchParams.get("scope_work_id")

    if (!scopeWorkId) {
      return NextResponse.json(
        { error: "scope_work_id query parameter is required" },
        { status: 400 }
      )
    }

    // Check if scope of work item exists and belongs to this quotation
    const [existing] = await sql`
      SELECT id FROM quotation_scope_work 
      WHERE id = ${parseInt(scopeWorkId)} AND quotation_id = ${quotationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Scope of work item not found" },
        { status: 404 }
      )
    }

    // Delete the scope of work item
    await sql`DELETE FROM quotation_scope_work WHERE id = ${parseInt(scopeWorkId)}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete scope of work item:", error)
    return NextResponse.json(
      {
        error: "Failed to delete scope of work item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
