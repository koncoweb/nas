import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { materialRequestSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/material-requests/[id]
 * Get a single material request with its items
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
    const requestId = parseInt(id)

    // Fetch material request with related data
    const [materialRequest] = await sql`
      SELECT 
        mr.id,
        mr.project_id,
        mr.requested_by,
        mr.request_type,
        mr.title,
        mr.urgency,
        mr.estimated_total_cost,
        mr.status,
        mr.created_at,
        mr.updated_at,
        p.title as project_title,
        p.project_number,
        u.name as requested_by_name
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE mr.id = ${requestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Fetch material request items
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
      WHERE mri.material_request_id = ${requestId}
      ORDER BY mri.id
    `

    return NextResponse.json({
      ...materialRequest,
      items,
    })
  } catch (error) {
    console.error("Failed to fetch material request:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch material request",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/material-requests/[id]
 * Update a material request
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
    const requestId = parseInt(id)
    const body = await request.json()

    // Check if material request exists and get current status
    const [existingRequest] = await sql`
      SELECT status FROM material_requests WHERE id = ${requestId}
    `

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Prevent editing if status is not draft
    if (existingRequest.status !== "draft") {
      return NextResponse.json(
        {
          error: "Cannot edit material request",
          details: ["Material request can only be edited when status is draft"],
          code: "INVALID_STATUS",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate status workflow if status is being changed
    if (body.status && body.status !== existingRequest.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["submitted"],
        submitted: ["under_review", "draft"],
        under_review: ["approved", "rejected", "submitted"],
        approved: [],
        rejected: ["draft"],
      }

      const allowedStatuses = validTransitions[existingRequest.status] || []
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            error: "Invalid status transition",
            details: [`Cannot transition from ${existingRequest.status} to ${body.status}`],
            code: "INVALID_STATUS_TRANSITION",
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Validate request body (partial update)
    const updateSchema = materialRequestSchema.partial()
    const validated = updateSchema.parse(body)

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validated.project_id !== undefined) {
      updates.push(`project_id = $${paramIndex}`)
      values.push(validated.project_id)
      paramIndex++
    }

    if (validated.request_type !== undefined) {
      updates.push(`request_type = $${paramIndex}`)
      values.push(validated.request_type)
      paramIndex++
    }

    if (validated.title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      values.push(validated.title)
      paramIndex++
    }

    if (validated.urgency !== undefined) {
      updates.push(`urgency = $${paramIndex}`)
      values.push(validated.urgency)
      paramIndex++
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    updates.push(`updated_at = NOW()`)

    // Update material request
    const [updatedRequest] = await sql`
      UPDATE material_requests
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = ${requestId}
      RETURNING 
        id,
        project_id,
        requested_by,
        request_type,
        title,
        urgency,
        estimated_total_cost,
        status,
        created_at,
        updated_at
    `

    return NextResponse.json(updatedRequest)
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

    console.error("Failed to update material request:", error)
    return NextResponse.json(
      {
        error: "Failed to update material request",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
