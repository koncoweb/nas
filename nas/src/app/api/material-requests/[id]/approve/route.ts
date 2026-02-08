import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

/**
 * POST /api/material-requests/[id]/approve
 * Approve a material request (leader only)
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

    // Check if user has leader role
    if (session.user.role !== "leader") {
      return NextResponse.json(
        {
          error: "Forbidden",
          details: ["Only leaders can approve material requests"],
          code: "INSUFFICIENT_PERMISSIONS",
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      )
    }

    const { id } = await params
    const requestId = parseInt(id)

    // Check if material request exists and get current status
    const [materialRequest] = await sql`
      SELECT status FROM material_requests WHERE id = ${requestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Validate status workflow - can only approve from under_review
    if (materialRequest.status !== "under_review") {
      return NextResponse.json(
        {
          error: "Invalid status transition",
          details: [`Material request must be under review to approve. Current status: ${materialRequest.status}`],
          code: "INVALID_STATUS_TRANSITION",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Update status to approved
    const [updatedRequest] = await sql`
      UPDATE material_requests
      SET status = 'approved', updated_at = NOW()
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
    console.error("Failed to approve material request:", error)
    return NextResponse.json(
      {
        error: "Failed to approve material request",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/material-requests/[id]/reject
 * Reject a material request (leader only)
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

    // Check if user has leader role
    if (session.user.role !== "leader") {
      return NextResponse.json(
        {
          error: "Forbidden",
          details: ["Only leaders can reject material requests"],
          code: "INSUFFICIENT_PERMISSIONS",
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      )
    }

    const { id } = await params
    const requestId = parseInt(id)

    // Check if material request exists and get current status
    const [materialRequest] = await sql`
      SELECT status FROM material_requests WHERE id = ${requestId}
    `

    if (!materialRequest) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      )
    }

    // Validate status workflow - can only reject from under_review
    if (materialRequest.status !== "under_review") {
      return NextResponse.json(
        {
          error: "Invalid status transition",
          details: [`Material request must be under review to reject. Current status: ${materialRequest.status}`],
          code: "INVALID_STATUS_TRANSITION",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Update status to rejected
    const [updatedRequest] = await sql`
      UPDATE material_requests
      SET status = 'rejected', updated_at = NOW()
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
    console.error("Failed to reject material request:", error)
    return NextResponse.json(
      {
        error: "Failed to reject material request",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
