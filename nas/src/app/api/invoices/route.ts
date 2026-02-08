import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { invoiceSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

// GET /api/invoices - List invoices with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const customerId = searchParams.get("customer_id") || ""
    const projectId = searchParams.get("project_id") || ""
    const offset = (page - 1) * limit

    // Build WHERE conditions as strings
    const conditions: string[] = []
    if (search) {
      conditions.push(`(i.invoice_number ILIKE '%${search}%' OR i.notes ILIKE '%${search}%')`)
    }
    if (status) {
      conditions.push(`i.status = '${status}'`)
    }
    if (customerId) {
      conditions.push(`i.customer_id = ${parseInt(customerId)}`)
    }
    if (projectId) {
      conditions.push(`i.project_id = ${parseInt(projectId)}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Get invoices with customer and project info
    const invoices = await sql`
      SELECT 
        i.*,
        c.company_name as customer_name,
        p.project_number,
        p.title as project_title,
        COALESCE(SUM(pay.amount), 0) as amount_paid
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN payments pay ON pay.invoice_id = i.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      GROUP BY i.id, c.company_name, p.project_number, p.title
      ORDER BY i.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as count
      FROM invoices i
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `
    const count = parseInt(countResult[0]?.count || "0")

    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data invoice" },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const body = await request.json()

    // Convert date strings to Date objects
  // Process dates
    const processedBody = {
      ...body,
      due_date: body.due_date ? new Date(body.due_date) : new Date(),
    }

    // Validate input
    const validated = invoiceSchema.parse(processedBody)

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // Create invoice
    const [invoice] = await sql`
      INSERT INTO invoices (
        invoice_number,
        project_id,
        customer_id,
        due_date,
        total_amount,
        status
      )
      VALUES (
        ${invoiceNumber},
        ${validated.project_id},
        ${validated.customer_id},
        ${validated.due_date},
        0,
        'draft'
      )
      RETURNING *
    `

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)

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
      { error: "Gagal membuat invoice" },
      { status: 500 }
    )
  }
}

// Helper function to generate unique invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Get the latest invoice number for this year
  const latest = await sql`
    SELECT invoice_number
    FROM invoices
    WHERE invoice_number LIKE ${prefix + "%"}
    ORDER BY invoice_number DESC
    LIMIT 1
  `

  if (latest.length === 0) {
    return `${prefix}0001`
  }

  // Extract the sequence number and increment
  const lastNumber = parseInt(latest[0].invoice_number.split("-")[2])
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0")

  return `${prefix}${nextNumber}`
}
