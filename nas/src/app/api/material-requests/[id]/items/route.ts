import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { materialRequestItemSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/material-requests/[id]/items
 * Get all items for a material request
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

    const materialRequestId = parseInt(id)

    // Verify material request exists
    const [materialRequest] = await sql`
      SELECT id FROM material_requests WHERE id = ${materialRequestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Fetch items
    const items = await sql`
      SELECT 
        mri.id,
        mri.material_request_id,
        mri.material_id,
        mri.description,
        mri.quantity,
        mri.estimated_unit_cost,
        m.name as material_name,
        m.unit_type
      FROM material_request_items mri
      LEFT JOIN materials m ON mri.material_id = m.id
      WHERE mri.material_request_id = ${materialRequestId}
      ORDER BY mri.id
    `

    return NextResponse.json({ data: items })
  } catch (error) {
    console.error("Failed to fetch material request items:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch material request items",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/material-requests/[id]/items
 * Add an item to a material request
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
    const materialRequestId = parseInt(id)
    const body = await request.json()

    // Check if material request exists and is in draft status
    const [materialRequest] = await sql`
      SELECT status FROM material_requests WHERE id = ${materialRequestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Prevent adding items if status is not draft
    if (materialRequest.status !== "draft") {
      return NextResponse.json(
        {
          error: "Cannot add items to material request",
          details: ["Items can only be added when status is draft"],
          code: "INVALID_STATUS",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate request body
    const validated = materialRequestItemSchema.parse({
      ...body,
      material_request_id: materialRequestId,
    })

    // Calculate line total
    const lineTotal = validated.quantity * validated.estimated_unit_cost

    // Insert item
    const [item] = await sql`
      INSERT INTO material_request_items (
        material_request_id,
        material_id,
        description,
        quantity,
        estimated_unit_cost
      )
      VALUES (
        ${validated.material_request_id},
        ${validated.material_id || null},
        ${validated.description},
        ${validated.quantity},
        ${validated.estimated_unit_cost}
      )
      RETURNING 
        id,
        material_request_id,
        material_id,
        description,
        quantity,
        estimated_unit_cost
    `

    // Recalculate estimated_total_cost for the material request
    const [{ total }] = await sql`
      SELECT COALESCE(SUM(quantity * estimated_unit_cost), 0) as total
      FROM material_request_items
      WHERE material_request_id = ${materialRequestId}
    `

    // Update material request with new total
    await sql`
      UPDATE material_requests
      SET estimated_total_cost = ${total}
      WHERE id = ${materialRequestId}
    `

    return NextResponse.json(item, { status: 201 })
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

    console.error("Failed to add material request item:", error)
    return NextResponse.json(
      {
        error: "Failed to add material request item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/material-requests/[id]/items/[itemId]
 * Update a material request item
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
    const materialRequestId = parseInt(id)
    const body = await request.json()
    const itemId = body.itemId

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }

    // Check if material request exists and is in draft status
    const [materialRequest] = await sql`
      SELECT status FROM material_requests WHERE id = ${materialRequestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Prevent editing items if status is not draft
    if (materialRequest.status !== "draft") {
      return NextResponse.json(
        {
          error: "Cannot edit items",
          details: ["Items can only be edited when status is draft"],
          code: "INVALID_STATUS",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate request body (partial update)
    const updateSchema = materialRequestItemSchema.partial()
    const validated = updateSchema.parse(body)

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validated.material_id !== undefined) {
      updates.push(`material_id = $${paramIndex}`)
      values.push(validated.material_id || null)
      paramIndex++
    }

    if (validated.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(validated.description)
      paramIndex++
    }

    if (validated.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex}`)
      values.push(validated.quantity)
      paramIndex++
    }

    if (validated.estimated_unit_cost !== undefined) {
      updates.push(`estimated_unit_cost = $${paramIndex}`)
      values.push(validated.estimated_unit_cost)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Update item
    const [updatedItem] = await sql`
      UPDATE material_request_items
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = ${itemId} AND material_request_id = ${materialRequestId}
      RETURNING 
        id,
        material_request_id,
        material_id,
        description,
        quantity,
        estimated_unit_cost
    `

    if (!updatedItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Recalculate estimated_total_cost for the material request
    const [{ total }] = await sql`
      SELECT COALESCE(SUM(quantity * estimated_unit_cost), 0) as total
      FROM material_request_items
      WHERE material_request_id = ${materialRequestId}
    `

    // Update material request with new total
    await sql`
      UPDATE material_requests
      SET estimated_total_cost = ${total}
      WHERE id = ${materialRequestId}
    `

    return NextResponse.json(updatedItem)
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

    console.error("Failed to update material request item:", error)
    return NextResponse.json(
      {
        error: "Failed to update material request item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/material-requests/[id]/items/[itemId]
 * Delete a material request item
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
    const materialRequestId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }

    // Check if material request exists and is in draft status
    const [materialRequest] = await sql`
      SELECT status FROM material_requests WHERE id = ${materialRequestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Prevent deleting items if status is not draft
    if (materialRequest.status !== "draft") {
      return NextResponse.json(
        {
          error: "Cannot delete items",
          details: ["Items can only be deleted when status is draft"],
          code: "INVALID_STATUS",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete item
    const [deletedItem] = await sql`
      DELETE FROM material_request_items
      WHERE id = ${parseInt(itemId)} AND material_request_id = ${materialRequestId}
      RETURNING id
    `

    if (!deletedItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Recalculate estimated_total_cost for the material request
    const [{ total }] = await sql`
      SELECT COALESCE(SUM(quantity * estimated_unit_cost), 0) as total
      FROM material_request_items
      WHERE material_request_id = ${materialRequestId}
    `

    // Update material request with new total
    await sql`
      UPDATE material_requests
      SET estimated_total_cost = ${total}
      WHERE id = ${materialRequestId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete material request item:", error)
    return NextResponse.json(
      {
        error: "Failed to delete material request item",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
