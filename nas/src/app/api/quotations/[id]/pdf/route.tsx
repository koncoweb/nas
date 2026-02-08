import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { renderToStream } from "@react-pdf/renderer"
import { QuotationPDF } from "@/lib/pdf/quotation-template"

/**
 * GET /api/quotations/[id]/pdf
 * Generate and download quotation as PDF
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
    const quotationId = parseInt(id)

    // Fetch quotation with customer information
    const [quotation] = await sql`
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
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.address
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ${quotationId}
    `

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Fetch line items
    const lineItems = await sql`
      SELECT 
        li.id,
        li.quotation_id,
        li.material_id,
        li.description,
        li.quantity,
        li.unit_price,
        li.line_total,
        m.name as material_name
      FROM quotation_line_items li
      LEFT JOIN materials m ON li.material_id = m.id
      WHERE li.quotation_id = ${quotationId}
      ORDER BY li.id ASC
    `

    // Fetch scope of work items
    const scopeWork = await sql`
      SELECT 
        id,
        quotation_id,
        step_number,
        description,
        work_category
      FROM quotation_scope_work
      WHERE quotation_id = ${quotationId}
      ORDER BY step_number ASC
    `

    // Generate PDF
    const pdfStream = await renderToStream(
      <QuotationPDF
        quotation={{
          id: quotation.id,
          quote_number: quotation.quote_number,
          title: quotation.title,
          description: quotation.description,
          labor_hours: quotation.labor_hours,
          labor_rate: quotation.labor_rate,
          materials_cost: quotation.materials_cost,
          labor_cost: quotation.labor_cost,
          total_cost: quotation.total_cost,
          profit_margin: quotation.profit_margin,
          status: quotation.status,
          created_at: quotation.created_at.toISOString(),
          company_name: quotation.company_name,
          contact_name: quotation.contact_name,
          email: quotation.email,
          phone: quotation.phone,
          address: quotation.address,
        }}
        lineItems={lineItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          material_name: item.material_name || null,
        }))}
        scopeWork={scopeWork.map((item) => ({
          id: item.id,
          step_number: item.step_number,
          description: item.description,
          work_category: item.work_category || null,
        }))}
      />
    )

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    // Return PDF as response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.quote_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Failed to generate quotation PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
