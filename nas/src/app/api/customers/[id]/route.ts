import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { customerSchema, formatZodErrors } from "@/lib/validations"
import { z } from "zod"

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
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
    const customerId = parseInt(id)
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      )
    }

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
      WHERE id = ${customerId}
    `

    if (customers.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(customers[0])
  } catch (error) {
    console.error("Failed to fetch customer:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch customer",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/customers/[id]
 * Update a customer
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
    const customerId = parseInt(id)
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validated = customerSchema.parse(body)

    // Update customer in database
    const [customer] = await sql`
      UPDATE customers
      SET
        company_name = ${validated.company_name},
        contact_name = ${validated.contact_name},
        email = ${validated.email},
        phone = ${validated.phone},
        address = ${validated.address || null},
        updated_at = NOW()
      WHERE id = ${customerId}
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

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
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

    console.error("Failed to update customer:", error)
    return NextResponse.json(
      {
        error: "Failed to update customer",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer (with referential integrity check)
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
    const customerId = parseInt(id)
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      )
    }

    // Check for related quotations
    const quotations = await sql`
      SELECT COUNT(*) as count
      FROM quotations
      WHERE customer_id = ${customerId}
    `

    if (parseInt(quotations[0].count as string) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete customer with existing quotations",
          details: ["This customer has related quotations. Please delete or reassign them first."],
          code: "REFERENTIAL_INTEGRITY_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check for related projects
    const projects = await sql`
      SELECT COUNT(*) as count
      FROM projects
      WHERE customer_id = ${customerId}
    `

    if (parseInt(projects[0].count as string) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete customer with existing projects",
          details: ["This customer has related projects. Please delete or reassign them first."],
          code: "REFERENTIAL_INTEGRITY_ERROR",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete customer
    const result = await sql`
      DELETE FROM customers
      WHERE id = ${customerId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to delete customer:", error)
    return NextResponse.json(
      {
        error: "Failed to delete customer",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
