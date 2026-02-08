import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { customerSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/customers
 * List customers with pagination and search
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
    const offset = (page - 1) * limit

    // Search across company_name, contact_name, email, phone
    const customers = await sql`
      SELECT 
        id,
        company_name,
        contact_name,
        email,
        phone,
        address,
        created_at,
        updated_at
      FROM customers
      WHERE 
        company_name ILIKE ${`%${search}%`}
        OR contact_name ILIKE ${`%${search}%`}
        OR email ILIKE ${`%${search}%`}
        OR phone ILIKE ${`%${search}%`}
      ORDER BY company_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const [{ count }] = await sql`
      SELECT COUNT(*) as count 
      FROM customers
      WHERE 
        company_name ILIKE ${`%${search}%`}
        OR contact_name ILIKE ${`%${search}%`}
        OR email ILIKE ${`%${search}%`}
        OR phone ILIKE ${`%${search}%`}
    `

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return NextResponse.json(
      { 
        error: "Gagal mengambil data pelanggan",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validated = customerSchema.parse(body)

    // Insert customer into database
    const [customer] = await sql`
      INSERT INTO customers (
        company_name,
        contact_name,
        email,
        phone,
        address
      )
      VALUES (
        ${validated.company_name},
        ${validated.contact_name},
        ${validated.email},
        ${validated.phone},
        ${validated.address || null}
      )
      RETURNING 
        id,
        company_name,
        contact_name,
        email,
        phone,
        address,
        created_at,
        updated_at
    `

    return NextResponse.json(customer, { status: 201 })
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

    console.error("Failed to create customer:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat pelanggan",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
