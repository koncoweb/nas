import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { materialSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/materials
 * List materials with pagination, search, and category filtering
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
    const category = searchParams.get("category") || ""
    const offset = (page - 1) * limit

    // Fetch materials with search and category filter
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
      WHERE 
        (${search}::text = '' OR (
          name ILIKE ${`%${search}%`}
          OR part_number ILIKE ${`%${search}%`}
          OR supplier ILIKE ${`%${search}%`}
        ))
        AND (${category}::text = '' OR category = ${category})
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM materials
      WHERE 
        (${search}::text = '' OR (
          name ILIKE ${`%${search}%`}
          OR part_number ILIKE ${`%${search}%`}
          OR supplier ILIKE ${`%${search}%`}
        ))
        AND (${category}::text = '' OR category = ${category})
    `

    return NextResponse.json({
      data: materials,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch materials:", error)
    return NextResponse.json(
      { 
        error: "Gagal mengambil data material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/materials
 * Create a new material
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validated = materialSchema.parse(body)

    // Insert material into database
    const [material] = await sql`
      INSERT INTO materials (
        name,
        description,
        category,
        unit_type,
        unit_cost,
        supplier,
        part_number
      )
      VALUES (
        ${validated.name},
        ${validated.description || null},
        ${validated.category},
        ${validated.unit_type},
        ${validated.unit_cost},
        ${validated.supplier || null},
        ${validated.part_number || null}
      )
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

    return NextResponse.json(material, { status: 201 })
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

    console.error("Failed to create material:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat material",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
