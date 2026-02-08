import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { projectCostSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

// GET /api/costs - List project costs with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const projectId = searchParams.get("project_id")
    const costType = searchParams.get("cost_type")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const offset = (page - 1) * limit

    // Build dynamic query with filters
    let costsQuery = sql`
      SELECT 
        pc.*,
        m.name as material_name,
        p.title as project_title,
        p.project_number
      FROM project_costs pc
      LEFT JOIN materials m ON pc.material_id = m.id
      LEFT JOIN projects p ON pc.project_id = p.id
      WHERE 1=1
    `

    // Add filters dynamically
    if (projectId) {
      costsQuery = sql`${costsQuery} AND pc.project_id = ${parseInt(projectId)}`
    }
    if (costType && costType !== 'all') {
      costsQuery = sql`${costsQuery} AND pc.cost_type = ${costType}`
    }
    if (startDate) {
      costsQuery = sql`${costsQuery} AND pc.purchase_date >= ${startDate}`
    }
    if (endDate) {
      costsQuery = sql`${costsQuery} AND pc.purchase_date <= ${endDate}`
    }

    costsQuery = sql`${costsQuery} ORDER BY pc.purchase_date DESC, pc.created_at DESC LIMIT ${limit} OFFSET ${offset}`

    const costs = await costsQuery

    // Get total count
    let countQuery = sql`
      SELECT COUNT(*) as count
      FROM project_costs
      WHERE 1=1
    `

    if (projectId) {
      countQuery = sql`${countQuery} AND project_id = ${parseInt(projectId)}`
    }
    if (costType && costType !== 'all') {
      countQuery = sql`${countQuery} AND cost_type = ${costType}`
    }
    if (startDate) {
      countQuery = sql`${countQuery} AND purchase_date >= ${startDate}`
    }
    if (endDate) {
      countQuery = sql`${countQuery} AND purchase_date <= ${endDate}`
    }

    const countResult = await countQuery
    const count = countResult[0]?.count || 0

    // Get cost aggregation by cost_type
    let aggregationQuery = sql`
      SELECT 
        cost_type,
        COUNT(*) as count,
        SUM(total_cost) as total
      FROM project_costs
      WHERE 1=1
    `

    if (projectId) {
      aggregationQuery = sql`${aggregationQuery} AND project_id = ${parseInt(projectId)}`
    }
    if (costType && costType !== 'all') {
      aggregationQuery = sql`${aggregationQuery} AND cost_type = ${costType}`
    }
    if (startDate) {
      aggregationQuery = sql`${aggregationQuery} AND purchase_date >= ${startDate}`
    }
    if (endDate) {
      aggregationQuery = sql`${aggregationQuery} AND purchase_date <= ${endDate}`
    }

    aggregationQuery = sql`${aggregationQuery} GROUP BY cost_type ORDER BY cost_type`

    const aggregation = await aggregationQuery

    return NextResponse.json({
      data: costs,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit),
      },
      aggregation: aggregation.map((agg: any) => ({
        cost_type: agg.cost_type,
        count: parseInt(agg.count),
        total: parseFloat(agg.total || 0),
      })),
    })
  } catch (error) {
    console.error("Error fetching costs:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data biaya" },
      { status: 500 }
    )
  }
}

// POST /api/costs - Create a new project cost
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()

    // Convert date string to Date object if needed
    if (body.purchase_date && typeof body.purchase_date === "string") {
      body.purchase_date = new Date(body.purchase_date)
    }

    // Validate input
    const validated = projectCostSchema.parse(body)

    // Insert cost
    const [cost] = await sql`
      INSERT INTO project_costs (
        project_id,
        cost_type,
        description,
        material_id,
        quantity,
        unit_cost,
        total_cost,
        vendor,
        purchase_date
      )
      VALUES (
        ${validated.project_id},
        ${validated.cost_type},
        ${validated.description},
        ${validated.material_id || null},
        ${validated.quantity || null},
        ${validated.unit_cost || null},
        ${validated.total_cost},
        ${validated.vendor || null},
        ${validated.purchase_date}
      )
      RETURNING *
    `

    return NextResponse.json(cost, { status: 201 })
  } catch (error) {
    console.error("Error creating cost:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validasi gagal",
          details: formatZodErrors(error),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal membuat biaya" },
      { status: 500 }
    )
  }
}
