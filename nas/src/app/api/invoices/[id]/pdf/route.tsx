import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { renderToStream } from "@react-pdf/renderer"
import { InvoicePDF } from "@/lib/pdf/invoice-template"

/**
 * GET /api/invoices/[id]/pdf
 * Generate and download invoice as PDF
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
    const invoiceId = parseInt(id)

    // Get invoice with customer and project info
    const invoiceResult = await sql`
      SELECT 
        i.id,
        i.invoice_number,
        i.issue_date,
        i.due_date,
        i.total_amount,
        i.amount_paid,
        i.status,
        i.notes,
        c.company_name as customer_name,
        c.contact_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        p.project_number,
        p.title as project_title
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ${invoiceId}
    `

    if (invoiceResult.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    const invoice = invoiceResult[0]

    // Get line items
    const lineItems = await sql`
      SELECT 
        id,
        description,
        quantity,
        unit_price,
        line_total
      FROM invoice_line_items
      WHERE invoice_id = ${invoiceId}
      ORDER BY id
    `

    // Generate PDF
    const pdfStream = await renderToStream(
      <InvoicePDF
        invoice={{
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date.toISOString(),
          due_date: invoice.due_date.toISOString(),
          total_amount: invoice.total_amount,
          amount_paid: invoice.amount_paid,
          status: invoice.status,
          notes: invoice.notes,
          customer_name: invoice.customer_name,
          contact_name: invoice.contact_name,
          customer_email: invoice.customer_email,
          customer_phone: invoice.customer_phone,
          customer_address: invoice.customer_address,
          project_number: invoice.project_number,
          project_title: invoice.project_title,
        }}
        lineItems={lineItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
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
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Failed to generate invoice PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
