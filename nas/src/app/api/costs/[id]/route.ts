import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { projectCostSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

// GET /api/costs/[id] - Get a single project cost
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
    const costId = parseInt(id)

    const [cost] = await sql`
      SELECT 
        pc.*,
        m.name as material_name,
        m.unit_type as material_unit_type,
        p.title as project_title,
        p.project_number
      FROM project_costs pc
      LEFT JOIN materials m ON pc.material_id = m.id
      LEFT JOIN projects p ON pc.project_id = p.id
      WHERE pc.id = ${costId}
    `

    if (!cost) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }

    return NextResponse.json(cost)
  } catch (error) {
    console.error("Error fetching cost:", error)
    return NextResponse.json(
      { error: "Failed to fetch cost" },
      { status: 500 }
    )
  }
}

// PUT /api/costs/[id] - Update a project cost
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
    const costId = parseInt(id)
    const body = await request.json()

    // Convert date string to Date object if needed
    if (body.cost_date && typeof body.cost_date === "string") {
      body.cost_date = new Date(body.cost_date)
    }

    // Validate input
    const validated = projectCostSchema.parse(body)

    // Check if cost exists
    const [existingCost] = await sql`
      SELECT id FROM project_costs WHERE id = ${costId}
    `

    if (!existingCost) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }

    // Update cost
    const [cost] = await sql`
      UPDATE project_costs
      SET
        project_id = ${validated.project_id},
        cost_type = ${validated.cost_type},
        description = ${validated.description},
        material_id = ${validated.material_id || null},
        quantity = ${validated.quantity || null},
        unit_cost = ${validated.unit_cost || null},
        total_cost = ${validated.total_cost},
        vendor = ${validated.vendor || null},
        cost_date = ${validated.cost_date}
      WHERE id = ${costId}
      RETURNING *
    `

    return NextResponse.json(cost)
  } catch (error) {
    console.error("Error updating cost:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(error),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update cost" },
      { status: 500 }
    )
  }
}

// DELETE /api/costs/[id] - Delete a project cost
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
    const costId = parseInt(id)

    // Check if cost exists
    const [existingCost] = await sql`
      SELECT id FROM project_costs WHERE id = ${costId}
    `

    if (!existingCost) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }

    // Delete cost
    await sql`
      DELETE FROM project_costs WHERE id = ${costId}
    `

    return NextResponse.json({ message: "Cost deleted successfully" })
  } catch (error) {
    console.error("Error deleting cost:", error)
    return NextResponse.json(
      { error: "Failed to delete cost" },
      { status: 500 }
    )
  }
}
