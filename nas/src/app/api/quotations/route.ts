import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { quotationSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/quotations
 * List quotations with pagination, search, and filters
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
    const customerId = searchParams.get("customer_id") || ""
    const offset = (page - 1) * limit

    // Build WHERE clause dynamically
    let whereConditions = []
    let params: any[] = []

    if (search) {
      whereConditions.push(`(q.title ILIKE $${params.length + 1} OR q.quote_number ILIKE $${params.length + 2} OR c.company_name ILIKE $${params.length + 3})`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status) {
      whereConditions.push(`q.status = $${params.length + 1}`)
      params.push(status)
    }

    if (customerId) {
      whereConditions.push(`q.customer_id = $${params.length + 1}`)
      params.push(parseInt(customerId))
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Fetch quotations with customer information
    const quotations = await sql`
      SELECT 
        q.id,
        q.quote_number,
        q.customer_id,
        q.title,
        q.description,
        q.labor_hours,
        q.labor_rate,
        q.materials_cost,
        q.labor_cost,
        q.total_cost,
        q.profit_margin,
        q.status,
        q.created_by,
        q.created_at,
        q.updated_at,
        c.company_name as customer_name
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `

    return NextResponse.json({
      data: quotations,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch quotations:", error)
    return NextResponse.json(
      { 
        error: "Gagal mengambil data penawaran",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quotations
 * Create a new quotation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validated = quotationSchema.parse(body)

    // Calculate costs
    const laborCost = validated.labor_hours * validated.labor_rate
    const materialsCost = 0 // Will be updated when line items are added
    const subtotal = laborCost + materialsCost
    const totalCost = subtotal + (subtotal * validated.profit_margin)

    // Generate quote number (format: Q-YYYYMMDD-XXXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    
    // Get the count of quotations created today to generate sequence number
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM quotations 
      WHERE quote_number LIKE ${"Q-" + dateStr + "-%"}
    `
    const sequence = (parseInt(count as string) + 1).toString().padStart(4, "0")
    const quoteNumber = `Q-${dateStr}-${sequence}`

    // Insert quotation into database
    const [quotation] = await sql`
      INSERT INTO quotations (
        quote_number,
        customer_id,
        title,
        description,
        labor_hours,
        labor_rate,
        materials_cost,
        labor_cost,
        total_cost,
        profit_margin,
        status,
        created_by
      )
      VALUES (
        ${quoteNumber},
        ${validated.customer_id},
        ${validated.title},
        ${validated.description || null},
        ${validated.labor_hours},
        ${validated.labor_rate},
        ${materialsCost},
        ${laborCost},
        ${totalCost},
        ${validated.profit_margin},
        'draft',
        ${session.user.id}
      )
      RETURNING 
        id,
        quote_number,
        customer_id,
        title,
        description,
        labor_hours,
        labor_rate,
        materials_cost,
        labor_cost,
        total_cost,
        profit_margin,
        status,
        created_by,
        created_at,
        updated_at
    `

    return NextResponse.json(quotation, { status: 201 })
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

    console.error("Failed to create quotation:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat penawaran",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
