import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { projectSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/projects
 * List projects with pagination, search, and filters
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
    const status = searchParams.get("status") || ""
    const assignedEngineer = searchParams.get("assigned_engineer") || ""
    const offset = (page - 1) * limit

    // Build WHERE clause dynamically
    let whereConditions = []
    let queryParams: any[] = []

    if (search) {
      whereConditions.push(`(p.title ILIKE $${queryParams.length + 1} OR p.project_number ILIKE $${queryParams.length + 2} OR c.company_name ILIKE $${queryParams.length + 3})`)
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status) {
      whereConditions.push(`p.status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }

    if (assignedEngineer) {
      whereConditions.push(`p.project_manager_id = $${queryParams.length + 1}`)
      queryParams.push(assignedEngineer)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Fetch projects with customer information
    const projects = await sql`
      SELECT 
        p.id,
        p.project_number,
        p.quotation_id,
        p.customer_id,
        p.title,
        p.description,
        p.status,
        p.project_manager_id,
        p.start_date,
        p.end_date as expected_completion,
        p.actual_end_date as actual_completion,
        p.created_at,
        p.updated_at,
        c.company_name as customer_name,
        u.name as project_manager_name
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON p.project_manager_id = u.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { 
        error: "Gagal mengambil data proyek",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validated = projectSchema.parse(body)

    // Generate project number (format: P-YYYYMMDD-XXXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    
    // Get the count of projects created today to generate sequence number
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE project_number LIKE ${"P-" + dateStr + "-%"}
    `
    const sequence = (parseInt(count as string) + 1).toString().padStart(4, "0")
    const projectNumber = `P-${dateStr}-${sequence}`

    // Insert project into database
    const [project] = await sql`
      INSERT INTO projects (
        project_number,
        quotation_id,
        customer_id,
        title,
        description,
        status,
        project_manager_id,
        start_date,
        end_date
      )
      VALUES (
        ${projectNumber},
        ${validated.quotation_id || null},
        ${validated.customer_id},
        ${validated.title},
        ${validated.description || null},
        'planning',
        ${validated.project_manager_id || null},
        ${validated.start_date || null},
        ${validated.end_date || null}
      )
      RETURNING 
        id,
        project_number,
        quotation_id,
        customer_id,
        title,
        description,
        status,
        project_manager_id,
        start_date,
        end_date as expected_completion,
        actual_end_date as actual_completion,
        created_at,
        updated_at
    `

    return NextResponse.json(project, { status: 201 })
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

    console.error("Failed to create project:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat proyek",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
