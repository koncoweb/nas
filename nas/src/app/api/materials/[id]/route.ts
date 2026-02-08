import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { materialSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/materials/[id]
 * Get a single material by ID
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
    const materialId = parseInt(id)
    if (isNaN(materialId)) {
      return NextResponse.json(
        { error: "Invalid material ID" },
        { status: 400 }
      )
    }

    const materials = await sql`
      SELECT 
        id,
        name,
        description,
        category,
        unit_type,
        unit_cost,
        supplier,
        part_number,
        created_at,
        updated_at
      FROM materials
      WHERE id = ${materialId}
    `

    if (materials.length === 0) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(materials[0])
  } catch (error) {
    console.error("Failed to fetch material:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/materials/[id]
 * Update a material
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
    const materialId = parseInt(id)
    if (isNaN(materialId)) {
      return NextResponse.json(
        { error: "Invalid material ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validated = materialSchema.parse(body)

    // Update material in database
    const [material] = await sql`
      UPDATE materials
      SET
        name = ${validated.name},
        description = ${validated.description || null},
        category = ${validated.category},
        unit_type = ${validated.unit_type},
        unit_cost = ${validated.unit_cost},
        supplier = ${validated.supplier || null},
        part_number = ${validated.part_number || null},
        updated_at = NOW()
      WHERE id = ${materialId}
      RETURNING 
        id,
        name,
        description,
        category,
        unit_type,
        unit_cost,
        supplier,
        part_number,
        created_at,
        updated_at
    `

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(material)
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

    console.error("Failed to update material:", error)
    return NextResponse.json(
      {
        error: "Failed to update material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/materials/[id]
 * Delete a material (with referential integrity check)
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
    const materialId = parseInt(id)
    if (isNaN(materialId)) {
      return NextResponse.json(
        { error: "Invalid material ID" },
        { status: 400 }
      )
    }

    // Check for related quotation line items
    const quotationLineItems = await sql`
      SELECT COUNT(*) as count
      FROM quotation_line_items
      WHERE material_id = ${materialId}
    `

    if (parseInt(quotationLineItems[0].count as string) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete material with existing quotation line items",
          details: ["This material is used in quotations. Please remove or replace it first."],
          code: "REFERENTIAL_INTEGRITY_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check for related material request items
    const materialRequestItems = await sql`
      SELECT COUNT(*) as count
      FROM material_request_items
      WHERE material_id = ${materialId}
    `

    if (parseInt(materialRequestItems[0].count as string) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete material with existing material request items",
          details: ["This material is used in material requests. Please remove or replace it first."],
          code: "REFERENTIAL_INTEGRITY_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check for related project costs
    const projectCosts = await sql`
      SELECT COUNT(*) as count
      FROM project_costs
      WHERE material_id = ${materialId}
    `

    if (parseInt(projectCosts[0].count as string) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete material with existing project costs",
          details: ["This material is linked to project costs. Please remove or replace it first."],
          code: "REFERENTIAL_INTEGRITY_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete material
    const result = await sql`
      DELETE FROM materials
      WHERE id = ${materialId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: "Material deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to delete material:", error)
    return NextResponse.json(
      {
        error: "Failed to delete material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
