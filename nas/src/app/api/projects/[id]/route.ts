import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { projectSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/projects/[id]
 * Get a single project with all related data
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

    const projectId = parseInt(id)

    // Fetch project with customer and engineer information
    const [project] = await sql`
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
        c.contact_name as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        u.name as project_manager_name,
        u.email as project_manager_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON p.project_manager_id = u.id
      WHERE p.id = ${projectId}
    `

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Fetch related quotation if exists
    let quotation = null
    if (project.quotation_id) {
      const [q] = await sql`
        SELECT 
          id,
          quote_number,
          title,
          description,
          labor_hours,
          labor_rate,
          materials_cost,
          labor_cost,
          total_cost,
          profit_margin,
          status,
          created_at
        FROM quotations
        WHERE id = ${project.quotation_id}
      `
      quotation = q || null
    }

    // Fetch project costs grouped by cost_type
    const costs = await sql`
      SELECT 
        id,
        cost_type,
        description,
        material_id,
        quantity,
        unit_cost,
        total_cost,
        vendor,
        purchase_date,
        created_at
      FROM project_costs
      WHERE project_id = ${projectId}
      ORDER BY purchase_date DESC
    `

    // Calculate total costs by type
    const costSummary = await sql`
      SELECT 
        cost_type,
        SUM(total_cost) as total
      FROM project_costs
      WHERE project_id = ${projectId}
      GROUP BY cost_type
    `

    // Fetch material requests
    const materialRequests = await sql`
      SELECT 
        id,
        request_type,
        title,
        urgency,
        estimated_total_cost,
        status,
        created_at
      FROM material_requests
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `

    // Fetch invoices
    const invoices = await sql`
      SELECT 
        id,
        invoice_number,
        due_date,
        total_amount,
        status,
        created_at
      FROM invoices
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `

    // Fetch project reports
    const reports = await sql`
      SELECT 
        id,
        completion_date,
        work_summary,
        materials_used,
        status,
        created_at
      FROM project_reports
      WHERE project_id = ${projectId}
      ORDER BY completion_date DESC
    `

    return NextResponse.json({
      ...project,
      quotation,
      costs,
      costSummary,
      materialRequests,
      invoices,
      reports
    })
  } catch (error) {
    console.error("Failed to fetch project:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch project",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
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
    const projectId = parseInt(id)
    const body = await request.json()

    // Check if project exists
    const [existingProject] = await sql`
      SELECT id, status FROM projects WHERE id = ${projectId}
    `

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Validate status workflow if status is being updated
    if (body.status && body.status !== existingProject.status) {
      const validTransitions: Record<string, string[]> = {
        planning: ["in_progress"],
        in_progress: ["completed"],
        completed: [] // No transitions from completed
      }

      const allowedStatuses = validTransitions[existingProject.status] || []
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            error: "Invalid status transition",
            details: [`Cannot transition from ${existingProject.status} to ${body.status}`],
            code: "INVALID_STATUS_TRANSITION",
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Validate request body (partial update)
    const updateSchema = projectSchema.partial()
    const validated = updateSchema.parse(body)

    // Build update fields
    const updateFields = []
    
    if (validated.title !== undefined) {
      updateFields.push({ key: 'title', value: validated.title })
    }
    if (validated.description !== undefined) {
      updateFields.push({ key: 'description', value: validated.description })
    }
    if (body.status !== undefined) {
      updateFields.push({ key: 'status', value: body.status })
      if (body.status === "completed") {
        updateFields.push({ key: 'actual_end_date', value: new Date() })
      }
    }
    if (validated.project_manager_id !== undefined) {
      updateFields.push({ key: 'project_manager_id', value: validated.project_manager_id })
    }
    if (validated.start_date !== undefined) {
      updateFields.push({ key: 'start_date', value: validated.start_date })
    }
    if (validated.end_date !== undefined) {
      updateFields.push({ key: 'end_date', value: validated.end_date })
    }
    
    updateFields.push({ key: 'updated_at', value: new Date() })

    if (updateFields.length === 1) { // Only updated_at
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Build the SET clause using template literals
    const setClause = updateFields
      .map(f => `${f.key} = '${f.value}'`)
      .join(', ')
    
    const result = await sql`
      UPDATE projects
      SET ${sql.unsafe(setClause)}
      WHERE id = ${projectId}
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
    
    const project = result[0]

    return NextResponse.json(project)
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

    console.error("Failed to update project:", error)
    return NextResponse.json(
      {
        error: "Failed to update project",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
