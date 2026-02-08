import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

/**
 * POST /api/quotations/[id]/convert-to-project
 * Convert an approved quotation to a project
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

    // Fetch the quotation
    const [quotation] = await sql`
      SELECT 
        id,
        quote_number,
        customer_id,
        title,
        description,
        status
      FROM quotations
      WHERE id = ${quotationId}
    `

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Validate quotation is approved
    if (quotation.status !== "approved") {
      return NextResponse.json(
        {
          error: "Quotation must be approved before conversion",
          details: [`Quotation status is ${quotation.status}, must be approved`],
          code: "INVALID_QUOTATION_STATUS",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if project already exists for this quotation
    const [existingProject] = await sql`
      SELECT id, project_number
      FROM projects
      WHERE quotation_id = ${quotationId}
    `

    if (existingProject) {
      return NextResponse.json(
        {
          error: "Project already exists for this quotation",
          details: [`Project ${existingProject.project_number} already created`],
          code: "PROJECT_ALREADY_EXISTS",
          timestamp: new Date().toISOString(),
          project: existingProject
        },
        { status: 400 }
      )
    }

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

    // Create project from quotation
    const [project] = await sql`
      INSERT INTO projects (
        project_number,
        quotation_id,
        customer_id,
        title,
        description,
        status,
        assigned_engineer,
        start_date,
        expected_completion
      )
      VALUES (
        ${projectNumber},
        ${quotationId},
        ${quotation.customer_id},
        ${quotation.title},
        ${quotation.description || null},
        'planning',
        NULL,
        NULL,
        NULL
      )
      RETURNING 
        id,
        project_number,
        quotation_id,
        customer_id,
        title,
        description,
        status,
        assigned_engineer,
        start_date,
        expected_completion,
        actual_completion,
        created_at,
        updated_at
    `

    return NextResponse.json(
      {
        message: "Quotation successfully converted to project",
        project
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to convert quotation to project:", error)
    return NextResponse.json(
      {
        error: "Failed to convert quotation to project",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
