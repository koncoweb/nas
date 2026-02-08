import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { materialRequestSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/material-requests
 * List material requests with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const search = searchParams.get("search") || ""
    const projectId = searchParams.get("project_id") || ""
    const status = searchParams.get("status") || ""
    const urgency = searchParams.get("urgency") || ""
    const offset = (page - 1) * limit

    // Build WHERE clause dynamically
    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(mr.title ILIKE $${paramIndex} OR p.title ILIKE $${paramIndex + 1} OR p.project_number ILIKE $${paramIndex + 2})`)
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
      paramIndex += 3
    }

    if (projectId) {
      whereConditions.push(`mr.project_id = $${paramIndex}`)
      queryParams.push(parseInt(projectId))
      paramIndex++
    }

    if (status) {
      whereConditions.push(`mr.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (urgency) {
      whereConditions.push(`mr.urgency = $${paramIndex}`)
      queryParams.push(urgency)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Fetch material requests with project and user information
    const materialRequests = await sql`
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
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY mr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `

    return NextResponse.json({
      data: materialRequests,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch material requests:", error)
    return NextResponse.json(
      { 
        error: "Gagal mengambil data permintaan material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/material-requests
 * Create a new material request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validated = materialRequestSchema.parse(body)

    // Insert material request into database
    const [materialRequest] = await sql`
      INSERT INTO material_requests (
        project_id,
        requested_by,
        request_type,
        title,
        urgency,
        estimated_total_cost,
        status
      )
      VALUES (
        ${validated.project_id},
        ${session.user.id},
        ${validated.request_type},
        ${validated.title},
        ${validated.urgency},
        0,
        'draft'
      )
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

    return NextResponse.json(materialRequest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validasi gagal",
          details: formatZodErrors(error),
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.error("Failed to create material request:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat permintaan material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
