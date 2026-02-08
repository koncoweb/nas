import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from "docx"

/**
 * GET /api/quotations/[id]/docx
 * Generate and download quotation as DOCX
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
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
        { error: "Penawaran tidak ditemukan" },
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

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // Format date
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(date))
    }

    // Create document sections
    const docSections: any[] = []

    // Company Header Space
    docSections.push(
      new Paragraph({
        text: "[SPACE UNTUK LOGO PERUSAHAAN]",
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        shading: {
          fill: "F3F4F6",
        },
      }),
      new Paragraph({
        text: "PT PELAYARAN NUSANTARA",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: "Jl. Pelabuhan Raya No. 123, Jakarta Utara 14440",
        alignment: AlignmentType.CENTER,
        spacing: { after: 30 },
      }),
      new Paragraph({
        text: "Telp: (021) 1234-5678 | Email: info@pelayarannusantara.com",
        alignment: AlignmentType.CENTER,
        spacing: { after: 30 },
      }),
      new Paragraph({
        text: "Website: www.pelayarannusantara.com",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )

    // Title
    docSections.push(
      new Paragraph({
        text: "PENAWARAN HARGA / QUOTATION",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "No: ", bold: true }),
          new TextRun(quotation.quote_number),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Tanggal / Date: ", bold: true }),
          new TextRun(formatDate(quotation.created_at)),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Status: ", bold: true }),
          new TextRun(quotation.status.toUpperCase()),
        ],
        spacing: { after: 200 },
      })
    )

    // Customer Information
    docSections.push(
      new Paragraph({
        text: "Quote To / Kepada:",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 150, after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Perusahaan / Company: ", bold: true }),
          new TextRun(quotation.company_name),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Kontak / Contact: ", bold: true }),
          new TextRun(quotation.contact_name),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Email: ", bold: true }),
          new TextRun(quotation.email),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Telepon / Phone: ", bold: true }),
          new TextRun(quotation.phone),
        ],
        spacing: { after: 80 },
      })
    )

    if (quotation.address) {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Alamat / Address: ", bold: true }),
            new TextRun(quotation.address),
          ],
          spacing: { after: 200 },
        })
      )
    }

    // Project Details
    docSections.push(
      new Paragraph({
        text: "Detail Proyek / Project Details",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 150, after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Judul / Title: ", bold: true }),
          new TextRun(quotation.title),
        ],
        spacing: { after: 80 },
      })
    )

    if (quotation.description) {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Deskripsi / Description: ", bold: true }),
            new TextRun(quotation.description),
          ],
          spacing: { after: 200 },
        })
      )
    }

    // Line Items Table
    if (lineItems.length > 0) {
      docSections.push(
        new Paragraph({
          text: "Material & Jasa / Materials & Services",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 150 },
        })
      )

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Deskripsi / Description", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Harga / Price", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })],
              shading: { fill: "F3F4F6" },
            }),
          ],
        }),
      ]

      lineItems.forEach((item: any, index: number) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph((index + 1).toString())],
              }),
              new TableCell({
                children: [new Paragraph(item.material_name || item.description)],
              }),
              new TableCell({
                children: [new Paragraph(item.quantity.toString())],
              }),
              new TableCell({
                children: [new Paragraph(formatCurrency(Number(item.unit_price)))],
              }),
              new TableCell({
                children: [new Paragraph(formatCurrency(Number(item.line_total)))],
              }),
            ],
          })
        )
      })

      docSections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      )
    }

    // Scope of Work
    if (scopeWork.length > 0) {
      docSections.push(
        new Paragraph({
          text: "Lingkup Pekerjaan / Scope of Work",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 },
        })
      )

      scopeWork.forEach((item: any) => {
        docSections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.step_number}. `, bold: true }),
              new TextRun(item.description),
              ...(item.work_category
                ? [new TextRun({ text: ` (${item.work_category})`, italics: true })]
                : []),
            ],
            spacing: { after: 80 },
          })
        )
      })
    }

    // Cost Summary
    docSections.push(
      new Paragraph({
        text: "Ringkasan Biaya / Cost Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Biaya Material / Materials Cost: ", bold: true }),
          new TextRun(formatCurrency(Number(quotation.materials_cost))),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Biaya Tenaga Kerja / Labor (${quotation.labor_hours} jam @ ${formatCurrency(Number(quotation.labor_rate))}/jam): `, 
            bold: true 
          }),
          new TextRun(formatCurrency(Number(quotation.labor_cost))),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Subtotal: ", bold: true }),
          new TextRun(formatCurrency(Number(quotation.materials_cost) + Number(quotation.labor_cost))),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Keuntungan / Profit (${(Number(quotation.profit_margin) * 100).toFixed(1)}%): `,
            bold: true,
          }),
          new TextRun(
            formatCurrency(
              (Number(quotation.materials_cost) + Number(quotation.labor_cost)) *
                Number(quotation.profit_margin)
            )
          ),
        ],
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "TOTAL HARGA / TOTAL PRICE: ", bold: true, size: 32 }),
          new TextRun({
            text: formatCurrency(Number(quotation.total_cost)),
            bold: true,
            size: 32,
          }),
        ],
        spacing: { before: 150, after: 250 },
        shading: {
          fill: "1E40AF",
          color: "FFFFFF",
        },
      })
    )

    // Footer
    docSections.push(
      new Paragraph({
        text: "Penawaran ini berlaku selama 30 hari sejak tanggal penerbitan.",
        spacing: { before: 250, after: 80 },
      }),
      new Paragraph({
        text: "This quotation is valid for 30 days from the date of issue.",
        spacing: { after: 150 },
      }),
      new Paragraph({
        text: "Terima kasih atas kepercayaan Anda kepada layanan kami.",
        spacing: { after: 80 },
      }),
      new Paragraph({
        text: "Thank you for considering our marine engineering services.",
      })
    )

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 284,    // 0.2 inch = 284 twips (minimal margin)
                right: 284,
                bottom: 284,
                left: 284,
              },
            },
          },
          children: docSections,
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Return DOCX as response
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="quotation-${quotation.quote_number}.docx"`,
      },
    })
  } catch (error) {
    console.error("Failed to generate quotation DOCX:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat file DOCX",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
