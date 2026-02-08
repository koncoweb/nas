# Technical Reference: PDF & DOCX Export Implementation

**Version**: 1.0  
**Last Updated**: 8 Februari 2026  
**Status**: Production Ready  
**Reference Implementation**: Quotation Export Feature

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dependencies](#dependencies)
4. [Implementation Patterns](#implementation-patterns)
5. [Code Templates](#code-templates)
6. [Best Practices](#best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Testing Guidelines](#testing-guidelines)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Dokumen ini adalah referensi teknis lengkap untuk implementasi fitur ekspor PDF dan DOCX berdasarkan implementasi sukses pada Quotation Export Feature. Gunakan dokumen ini sebagai panduan untuk mengimplementasikan fitur serupa di bagian lain aplikasi (Invoice, Material Request, Project Report, dll).

### Key Success Factors

✅ **Professional Layout** - Space untuk logo, header perusahaan, footer  
✅ **Bilingual Support** - Indonesia & English  
✅ **Editable DOCX** - User dapat edit setelah download  
✅ **Consistent Styling** - PDF dan DOCX memiliki layout identik  
✅ **Error Handling** - Robust error handling dan user feedback  
✅ **Type Safety** - Full TypeScript support  

---

## Architecture

### File Structure Pattern

```
src/
├── app/
│   └── api/
│       └── [entity]/
│           └── [id]/
│               ├── pdf/
│               │   └── route.tsx          # PDF API endpoint
│               └── docx/
│                   └── route.ts           # DOCX API endpoint
├── lib/
│   └── pdf/
│       └── [entity]-template.tsx          # PDF template component
└── app/
    └── (dashboard)/
        └── [entity]/
            └── [id]/
                └── page.tsx               # UI with download buttons
```

### Data Flow

```
┌─────────────┐
│   UI Page   │
│  (Client)   │
└──────┬──────┘
       │ Click Download
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  PDF API    │   │  DOCX API   │
│  (Server)   │   │  (Server)   │
└──────┬──────┘   └──────┬──────┘
       │                 │
       ├─────────────────┤
       │ Fetch Data      │
       ▼                 ▼
┌─────────────────────────┐
│      Database           │
└─────────────────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ Generate    │   │ Generate    │
│ PDF Buffer  │   │ DOCX Buffer │
└──────┬──────┘   └──────┬──────┘
       │                 │
       └─────────┬───────┘
                 │
                 ▼
         ┌──────────────┐
         │   Download   │
         │   to User    │
         └──────────────┘
```

---

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "@react-pdf/renderer": "^4.3.2",
    "docx": "^8.5.0"
  }
}
```

### Installation

```bash
npm install @react-pdf/renderer docx --save
```

### Import Statements

**For PDF (React Component)**:
```typescript
import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer"
import { renderToStream } from "@react-pdf/renderer"
```

**For DOCX (Node.js)**:
```typescript
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
} from "docx"
```

---


## Implementation Patterns

### Pattern 1: PDF API Route

**Location**: `src/app/api/[entity]/[id]/pdf/route.tsx`

**Key Components**:
1. Authentication check
2. Data fetching from database
3. PDF generation using React component
4. Stream to buffer conversion
5. Response with proper headers

**Template**:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { renderToStream } from "@react-pdf/renderer"
import { EntityPDF } from "@/lib/pdf/entity-template"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    // 2. Get ID from params
    const { id } = await params
    const entityId = parseInt(id)

    // 3. Fetch main data
    const [entity] = await sql`
      SELECT * FROM entities WHERE id = ${entityId}
    `

    if (!entity) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      )
    }

    // 4. Fetch related data (if needed)
    const relatedData = await sql`
      SELECT * FROM related_table WHERE entity_id = ${entityId}
    `

    // 5. Generate PDF
    const pdfStream = await renderToStream(
      <EntityPDF entity={entity} relatedData={relatedData} />
    )

    // 6. Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    // 7. Return response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="entity-${entity.number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat PDF",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
```

### Pattern 2: PDF Template Component

**Location**: `src/lib/pdf/[entity]-template.tsx`

**Key Components**:
1. StyleSheet definition
2. Document structure
3. Reusable components
4. Data formatting functions

**Template**:
```typescript
import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

// 1. Define Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  companyHeader: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2pt solid #1e40af",
  },
  companyLogoSpace: {
    height: 60,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 10,
    textAlign: "center",
    justifyContent: "center",
  },
  // ... more styles
})

// 2. Define Props Interface
interface EntityPDFProps {
  entity: {
    id: number
    number: string
    // ... other fields
  }
  relatedData: Array<any>
}

// 3. Helper Functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

// 4. Main Component
export const EntityPDF: React.FC<EntityPDFProps> = ({
  entity,
  relatedData,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyLogoSpace}>
            <Text>[Space untuk Logo Perusahaan]</Text>
          </View>
          <Text>PT PELAYARAN NUSANTARA</Text>
          {/* ... company info */}
        </View>

        {/* Content sections */}
        {/* ... */}
      </Page>
    </Document>
  )
}
```

### Pattern 3: DOCX API Route

**Location**: `src/app/api/[entity]/[id]/docx/route.ts`

**Key Components**:
1. Authentication check
2. Data fetching
3. Document sections building
4. DOCX generation
5. Response with proper headers

**Template**:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
} from "docx"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    // 2. Get ID and fetch data
    const { id } = await params
    const entityId = parseInt(id)

    const [entity] = await sql`
      SELECT * FROM entities WHERE id = ${entityId}
    `

    if (!entity) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      )
    }

    // 3. Helper functions
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // 4. Build document sections
    const docSections: any[] = []

    // Company Header
    docSections.push(
      new Paragraph({
        text: "[SPACE UNTUK LOGO PERUSAHAAN]",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        shading: { fill: "F3F4F6" },
      }),
      new Paragraph({
        text: "PT PELAYARAN NUSANTARA",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
      // ... more sections
    )

    // 5. Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docSections,
        },
      ],
    })

    // 6. Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // 7. Return response
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="entity-${entity.number}.docx"`,
      },
    })
  } catch (error) {
    console.error("Failed to generate DOCX:", error)
    return NextResponse.json(
      {
        error: "Gagal membuat file DOCX",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
```

### Pattern 4: UI Download Buttons

**Location**: `src/app/(dashboard)/[entity]/[id]/page.tsx`

**Key Components**:
1. State management for loading
2. Download handler functions
3. Button components with icons
4. Error handling

**Template**:
```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  IconFileTypePdf,
  IconFileTypeDocx,
} from "@tabler/icons-react"

export default function EntityDetailPage() {
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const response = await fetch(`/api/entities/${entityId}/pdf`)
      if (!response.ok) {
        throw new Error("Gagal mengunduh PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `entity-${entity.number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download PDF:", error)
      alert("Gagal mengunduh PDF")
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true)
    try {
      const response = await fetch(`/api/entities/${entityId}/docx`)
      if (!response.ok) {
        throw new Error("Gagal mengunduh DOCX")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `entity-${entity.number}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download DOCX:", error)
      alert("Gagal mengunduh DOCX")
    } finally {
      setDownloadingDocx(false)
    }
  }

  return (
    <div>
      {/* Header with download buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          variant="outline"
        >
          <IconFileTypePdf className="w-4 h-4 mr-2" />
          {downloadingPdf ? "Mengunduh..." : "Download PDF"}
        </Button>
        <Button
          onClick={handleDownloadDocx}
          disabled={downloadingDocx}
          variant="outline"
        >
          <IconFileTypeDocx className="w-4 h-4 mr-2" />
          {downloadingDocx ? "Mengunduh..." : "Download DOCX"}
        </Button>
      </div>
      {/* Rest of the page */}
    </div>
  )
}
```

---


## Code Templates

### Template 1: Company Header (PDF)

```typescript
// In StyleSheet
companyHeader: {
  marginBottom: 30,
  paddingBottom: 20,
  borderBottom: "2pt solid #1e40af",
},
companyName: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#1e40af",
  marginBottom: 5,
},
companyInfo: {
  fontSize: 9,
  color: "#6b7280",
  marginBottom: 2,
},
companyLogoSpace: {
  height: 60,
  marginBottom: 10,
  backgroundColor: "#f9fafb",
  borderRadius: 4,
  padding: 10,
  textAlign: "center",
  justifyContent: "center",
},

// In Component
<View style={styles.companyHeader}>
  <View style={styles.companyLogoSpace}>
    <Text style={styles.logoPlaceholder}>
      [Space untuk Logo Perusahaan]
    </Text>
  </View>
  <Text style={styles.companyName}>PT PELAYARAN NUSANTARA</Text>
  <Text style={styles.companyInfo}>
    Jl. Pelabuhan Raya No. 123, Jakarta Utara 14440
  </Text>
  <Text style={styles.companyInfo}>
    Telp: (021) 1234-5678 | Email: info@pelayarannusantara.com
  </Text>
  <Text style={styles.companyInfo}>
    Website: www.pelayarannusantara.com
  </Text>
</View>
```

### Template 2: Company Header (DOCX)

```typescript
docSections.push(
  new Paragraph({
    text: "[SPACE UNTUK LOGO PERUSAHAAN]",
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    shading: {
      fill: "F3F4F6",
    },
  }),
  new Paragraph({
    text: "PT PELAYARAN NUSANTARA",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }),
  new Paragraph({
    text: "Jl. Pelabuhan Raya No. 123, Jakarta Utara 14440",
    alignment: AlignmentType.CENTER,
    spacing: { after: 50 },
  }),
  new Paragraph({
    text: "Telp: (021) 1234-5678 | Email: info@pelayarannusantara.com",
    alignment: AlignmentType.CENTER,
    spacing: { after: 50 },
  }),
  new Paragraph({
    text: "Website: www.pelayarannusantara.com",
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  })
)
```

### Template 3: Data Table (PDF)

```typescript
// In StyleSheet
table: {
  marginTop: 10,
},
tableHeader: {
  flexDirection: "row",
  backgroundColor: "#f3f4f6",
  padding: 8,
  fontWeight: "bold",
  borderBottom: "1pt solid #d1d5db",
},
tableRow: {
  flexDirection: "row",
  padding: 8,
  borderBottom: "1pt solid #e5e7eb",
},
tableCol1: { width: "10%" },
tableCol2: { width: "40%" },
tableCol3: { width: "15%" },
tableCol4: { width: "15%" },
tableCol5: { width: "20%", textAlign: "right" },

// In Component
<View style={styles.table}>
  <View style={styles.tableHeader}>
    <Text style={styles.tableCol1}>No</Text>
    <Text style={styles.tableCol2}>Deskripsi</Text>
    <Text style={styles.tableCol3}>Qty</Text>
    <Text style={styles.tableCol4}>Harga</Text>
    <Text style={styles.tableCol5}>Total</Text>
  </View>
  {items.map((item, index) => (
    <View key={item.id} style={styles.tableRow}>
      <Text style={styles.tableCol1}>{index + 1}</Text>
      <Text style={styles.tableCol2}>{item.description}</Text>
      <Text style={styles.tableCol3}>{item.quantity}</Text>
      <Text style={styles.tableCol4}>
        {formatCurrency(item.unit_price)}
      </Text>
      <Text style={styles.tableCol5}>
        {formatCurrency(item.total)}
      </Text>
    </View>
  ))}
</View>
```

### Template 4: Data Table (DOCX)

```typescript
const tableRows = [
  // Header row
  new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "No", bold: true })],
          }),
        ],
        shading: { fill: "F3F4F6" },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Deskripsi", bold: true })],
          }),
        ],
        shading: { fill: "F3F4F6" },
      }),
      // ... more header cells
    ],
  }),
]

// Data rows
items.forEach((item, index) => {
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph((index + 1).toString())],
        }),
        new TableCell({
          children: [new Paragraph(item.description)],
        }),
        // ... more data cells
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
```

### Template 5: Bilingual Section Headers

```typescript
// PDF
<Text style={styles.sectionTitle}>
  Kepada / To:
</Text>

<Text style={styles.sectionTitle}>
  Detail Proyek / Project Details
</Text>

<Text style={styles.sectionTitle}>
  Material & Jasa / Materials & Services
</Text>

<Text style={styles.sectionTitle}>
  Ringkasan Biaya / Cost Summary
</Text>

// DOCX
new Paragraph({
  text: "Kepada / To:",
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 200 },
})

new Paragraph({
  text: "Detail Proyek / Project Details",
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 200 },
})
```

### Template 6: Currency Formatting

```typescript
// Indonesian Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

// US Dollar
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Custom format
const formatCurrency = (amount: number) => {
  return `Rp ${amount.toLocaleString("id-ID")}`
}
```

### Template 7: Date Formatting

```typescript
// Indonesian format
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}
// Output: "8 Februari 2026"

// English format
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}
// Output: "February 8, 2026"

// Short format
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}
// Output: "08/02/2026"
```

### Template 8: Status Badge (PDF)

```typescript
// In StyleSheet
statusBadge: {
  padding: "4 8",
  borderRadius: 4,
  fontSize: 9,
  fontWeight: "bold",
  textTransform: "uppercase",
  alignSelf: "flex-start",
},
statusDraft: {
  backgroundColor: "#f3f4f6",
  color: "#6b7280",
},
statusApproved: {
  backgroundColor: "#d1fae5",
  color: "#065f46",
},
statusRejected: {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
},

// Helper function
const getStatusStyle = (status: string) => {
  switch (status) {
    case "draft":
      return styles.statusDraft
    case "approved":
      return styles.statusApproved
    case "rejected":
      return styles.statusRejected
    default:
      return styles.statusDraft
  }
}

// In Component
<View style={[styles.statusBadge, getStatusStyle(entity.status)]}>
  <Text>{entity.status.toUpperCase()}</Text>
</View>
```

### Template 9: Footer with Terms (PDF)

```typescript
// In StyleSheet
footer: {
  position: "absolute",
  bottom: 30,
  left: 40,
  right: 40,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 8,
  borderTop: "1pt solid #e5e7eb",
  paddingTop: 10,
},

// In Component
<View style={styles.footer}>
  <Text>
    Penawaran ini berlaku selama 30 hari sejak tanggal penerbitan.
  </Text>
  <Text>
    This quotation is valid for 30 days from the date of issue.
  </Text>
  <Text style={{ marginTop: 5 }}>
    Terima kasih atas kepercayaan Anda kepada layanan kami.
  </Text>
  <Text>
    Thank you for considering our services.
  </Text>
</View>
```

### Template 10: Footer with Terms (DOCX)

```typescript
docSections.push(
  new Paragraph({
    text: "Penawaran ini berlaku selama 30 hari sejak tanggal penerbitan.",
    spacing: { before: 400, after: 100 },
  }),
  new Paragraph({
    text: "This quotation is valid for 30 days from the date of issue.",
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: "Terima kasih atas kepercayaan Anda kepada layanan kami.",
    spacing: { after: 100 },
  }),
  new Paragraph({
    text: "Thank you for considering our services.",
  })
)
```

---


## Best Practices

### 1. Data Fetching

✅ **DO**:
```typescript
// Fetch all related data in parallel
const [entity, items, relatedData] = await Promise.all([
  sql`SELECT * FROM entities WHERE id = ${id}`,
  sql`SELECT * FROM items WHERE entity_id = ${id}`,
  sql`SELECT * FROM related WHERE entity_id = ${id}`,
])
```

❌ **DON'T**:
```typescript
// Sequential fetching (slower)
const entity = await sql`SELECT * FROM entities WHERE id = ${id}`
const items = await sql`SELECT * FROM items WHERE entity_id = ${id}`
const relatedData = await sql`SELECT * FROM related WHERE entity_id = ${id}`
```

### 2. Type Safety

✅ **DO**:
```typescript
// Define proper interfaces
interface EntityPDFProps {
  entity: {
    id: number
    number: string
    amount: number
    // ... all fields
  }
  items: Array<{
    id: number
    description: string
    quantity: number
    // ... all fields
  }>
}

export const EntityPDF: React.FC<EntityPDFProps> = ({ entity, items }) => {
  // TypeScript will catch errors
}
```

❌ **DON'T**:
```typescript
// Using any types
export const EntityPDF = ({ entity, items }: any) => {
  // No type safety
}
```

### 3. Error Handling

✅ **DO**:
```typescript
try {
  const response = await fetch(`/api/entities/${id}/pdf`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Gagal mengunduh PDF")
  }
  // ... handle success
} catch (error) {
  console.error("Download failed:", error)
  alert(error instanceof Error ? error.message : "Gagal mengunduh PDF")
}
```

❌ **DON'T**:
```typescript
// Silent failures
try {
  const response = await fetch(`/api/entities/${id}/pdf`)
  // No error checking
} catch (error) {
  // No user feedback
}
```

### 4. Loading States

✅ **DO**:
```typescript
const [downloading, setDownloading] = useState(false)

const handleDownload = async () => {
  setDownloading(true)
  try {
    // ... download logic
  } finally {
    setDownloading(false) // Always reset
  }
}

<Button disabled={downloading}>
  {downloading ? "Mengunduh..." : "Download"}
</Button>
```

❌ **DON'T**:
```typescript
// No loading state
const handleDownload = async () => {
  // ... download logic
}

<Button>Download</Button> // No feedback
```

### 5. Memory Management

✅ **DO**:
```typescript
const blob = await response.blob()
const url = window.URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.download = filename
document.body.appendChild(a)
a.click()
window.URL.revokeObjectURL(url) // Clean up
document.body.removeChild(a)    // Clean up
```

❌ **DON'T**:
```typescript
const url = window.URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.click()
// Memory leak - no cleanup
```

### 6. Consistent Styling

✅ **DO**:
```typescript
// Define color palette
const colors = {
  primary: "#1e40af",
  secondary: "#6b7280",
  success: "#065f46",
  danger: "#991b1b",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
}

// Use consistently
const styles = StyleSheet.create({
  header: {
    color: colors.primary,
    borderBottom: `2pt solid ${colors.primary}`,
  },
})
```

❌ **DON'T**:
```typescript
// Hardcoded colors everywhere
const styles = StyleSheet.create({
  header: {
    color: "#1e40af",
    borderBottom: "2pt solid #1e40af",
  },
  section: {
    color: "#1e3fae", // Typo!
  },
})
```

### 7. Responsive Layout

✅ **DO**:
```typescript
// Use percentage widths for tables
tableCol1: { width: "10%" },
tableCol2: { width: "40%" },
tableCol3: { width: "15%" },
tableCol4: { width: "15%" },
tableCol5: { width: "20%" },
// Total: 100%
```

❌ **DON'T**:
```typescript
// Fixed pixel widths
tableCol1: { width: 50 },
tableCol2: { width: 200 },
// May overflow or leave gaps
```

### 8. Bilingual Content

✅ **DO**:
```typescript
// Clear separation
<Text>Kepada / To:</Text>
<Text>Detail Proyek / Project Details</Text>

// Or use helper function
const t = (id: string, en: string) => `${id} / ${en}`
<Text>{t("Kepada", "To")}:</Text>
```

❌ **DON'T**:
```typescript
// Mixed or unclear
<Text>To (Kepada):</Text>
<Text>Project Details</Text> // Missing Indonesian
```

### 9. Number Formatting

✅ **DO**:
```typescript
// Always wrap database numbers
const amount = Number(entity.amount)
const formatted = formatCurrency(amount)

// Handle null/undefined
const amount = Number(entity.amount || 0)
```

❌ **DON'T**:
```typescript
// Direct use (may be string from DB)
const formatted = formatCurrency(entity.amount) // Error if string!
```

### 10. Code Organization

✅ **DO**:
```typescript
// Separate concerns
// 1. Imports
// 2. Interfaces
// 3. Helper functions
// 4. Styles
// 5. Component

import { ... }

interface Props { ... }

const formatCurrency = () => { ... }
const formatDate = () => { ... }

const styles = StyleSheet.create({ ... })

export const Component = () => { ... }
```

❌ **DON'T**:
```typescript
// Mixed organization
export const Component = () => {
  const formatCurrency = () => { ... } // Inside component
  const styles = { ... } // Recreated on every render
  // ...
}
```

---

## Common Pitfalls

### Pitfall 1: Stream Not Converted to Buffer

❌ **Problem**:
```typescript
const pdfStream = await renderToStream(<PDF />)
return new NextResponse(pdfStream) // Error!
```

✅ **Solution**:
```typescript
const pdfStream = await renderToStream(<PDF />)
const chunks: Buffer[] = []
for await (const chunk of pdfStream) {
  chunks.push(Buffer.from(chunk))
}
const buffer = Buffer.concat(chunks)
return new NextResponse(buffer)
```

### Pitfall 2: Incorrect DOCX Buffer Type

❌ **Problem**:
```typescript
const buffer = await Packer.toBuffer(doc)
return new NextResponse(buffer) // Type error!
```

✅ **Solution**:
```typescript
const buffer = await Packer.toBuffer(doc)
return new NextResponse(Buffer.from(buffer))
```

### Pitfall 3: Missing Await on Params

❌ **Problem**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params // Error in Next.js 15+
}
```

✅ **Solution**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params // Correct
}
```

### Pitfall 4: Paragraph Bold Property

❌ **Problem**:
```typescript
new Paragraph({ text: "Bold Text", bold: true }) // Error!
```

✅ **Solution**:
```typescript
new Paragraph({
  children: [new TextRun({ text: "Bold Text", bold: true })],
})
```

### Pitfall 5: Table Cell Without Paragraph

❌ **Problem**:
```typescript
new TableCell({
  children: [new TextRun({ text: "Cell" })], // Error!
})
```

✅ **Solution**:
```typescript
new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun({ text: "Cell" })],
    }),
  ],
})
```

### Pitfall 6: Forgetting to Handle Null Values

❌ **Problem**:
```typescript
<Text>{entity.description}</Text> // Error if null!
```

✅ **Solution**:
```typescript
{entity.description && (
  <Text>{entity.description}</Text>
)}

// Or
<Text>{entity.description || "N/A"}</Text>
```

### Pitfall 7: Wrong Content-Type Header

❌ **Problem**:
```typescript
headers: {
  "Content-Type": "application/word", // Wrong!
}
```

✅ **Solution**:
```typescript
// For PDF
headers: {
  "Content-Type": "application/pdf",
}

// For DOCX
headers: {
  "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
```

### Pitfall 8: Not Cleaning Up Blob URLs

❌ **Problem**:
```typescript
const url = window.URL.createObjectURL(blob)
a.href = url
a.click()
// Memory leak!
```

✅ **Solution**:
```typescript
const url = window.URL.createObjectURL(blob)
a.href = url
a.click()
window.URL.revokeObjectURL(url) // Clean up
document.body.removeChild(a)
```

### Pitfall 9: Inconsistent Spacing

❌ **Problem**:
```typescript
// PDF
marginBottom: 10

// DOCX
spacing: { after: 200 }
// Different visual spacing!
```

✅ **Solution**:
```typescript
// Use consistent multipliers
// PDF: 1 unit = 1pt
// DOCX: 1 unit = 1/20pt (twips)
// So DOCX spacing should be ~20x PDF

// PDF
marginBottom: 10 // 10pt

// DOCX
spacing: { after: 200 } // 200 twips = 10pt
```

### Pitfall 10: Missing Error Boundaries

❌ **Problem**:
```typescript
// No try-catch in API route
export async function GET() {
  const data = await fetchData() // May throw
  return generatePDF(data)
}
```

✅ **Solution**:
```typescript
export async function GET() {
  try {
    const data = await fetchData()
    return generatePDF(data)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Gagal membuat PDF" },
      { status: 500 }
    )
  }
}
```

---


## Testing Guidelines

### Unit Testing

**Test PDF Generation**:
```typescript
// test-pdf-generation.js
const fetch = require("node-fetch")

async function testPDFGeneration() {
  try {
    const response = await fetch("http://localhost:3000/api/quotations/1/pdf")
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType !== "application/pdf") {
      throw new Error(`Wrong content type: ${contentType}`)
    }

    const buffer = await response.buffer()
    if (buffer.length === 0) {
      throw new Error("Empty PDF buffer")
    }

    console.log("✅ PDF generation successful")
    console.log(`   Size: ${buffer.length} bytes`)
    return true
  } catch (error) {
    console.error("❌ PDF generation failed:", error.message)
    return false
  }
}

testPDFGeneration()
```

**Test DOCX Generation**:
```typescript
// test-docx-generation.js
const fetch = require("node-fetch")

async function testDOCXGeneration() {
  try {
    const response = await fetch("http://localhost:3000/api/quotations/1/docx")
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    const expectedType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if (contentType !== expectedType) {
      throw new Error(`Wrong content type: ${contentType}`)
    }

    const buffer = await response.buffer()
    if (buffer.length === 0) {
      throw new Error("Empty DOCX buffer")
    }

    console.log("✅ DOCX generation successful")
    console.log(`   Size: ${buffer.length} bytes`)
    return true
  } catch (error) {
    console.error("❌ DOCX generation failed:", error.message)
    return false
  }
}

testDOCXGeneration()
```

### Manual Testing Checklist

**PDF Testing**:
- [ ] PDF downloads successfully
- [ ] Filename is correct
- [ ] PDF opens without errors
- [ ] Company header displays correctly
- [ ] Logo space is visible
- [ ] All data is accurate
- [ ] Tables are formatted correctly
- [ ] Currency formatting is correct
- [ ] Date formatting is correct
- [ ] Bilingual text is present
- [ ] Footer displays correctly
- [ ] No text overflow
- [ ] Page breaks are appropriate
- [ ] Print preview looks good

**DOCX Testing**:
- [ ] DOCX downloads successfully
- [ ] Filename is correct
- [ ] DOCX opens in Word/LibreOffice
- [ ] Company header displays correctly
- [ ] Logo space is visible
- [ ] All data is accurate
- [ ] Tables are formatted correctly
- [ ] Can edit text after opening
- [ ] Can edit tables after opening
- [ ] Formatting is preserved
- [ ] Bilingual text is present
- [ ] Footer displays correctly
- [ ] No layout issues

**UI Testing**:
- [ ] Download buttons are visible
- [ ] Icons display correctly
- [ ] Loading state shows during download
- [ ] Button disables during download
- [ ] Error messages display on failure
- [ ] Success feedback (file downloads)
- [ ] Works on Chrome
- [ ] Works on Firefox
- [ ] Works on Edge
- [ ] Works on Safari
- [ ] Works on mobile browsers

**Error Handling Testing**:
- [ ] Invalid ID returns 404
- [ ] Unauthorized access returns 401
- [ ] Database errors return 500
- [ ] Network errors show user message
- [ ] Timeout errors are handled
- [ ] Large data sets don't crash

### Performance Testing

**Benchmark Script**:
```typescript
// benchmark-export.js
const fetch = require("node-fetch")

async function benchmark(url, iterations = 10) {
  const times = []
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    const response = await fetch(url)
    await response.buffer()
    const end = Date.now()
    times.push(end - start)
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)

  console.log(`Average: ${avg.toFixed(2)}ms`)
  console.log(`Min: ${min}ms`)
  console.log(`Max: ${max}ms`)
}

console.log("PDF Benchmark:")
await benchmark("http://localhost:3000/api/quotations/1/pdf")

console.log("\nDOCX Benchmark:")
await benchmark("http://localhost:3000/api/quotations/1/docx")
```

**Expected Performance**:
- PDF generation: < 1000ms for typical document
- DOCX generation: < 1500ms for typical document
- File size: 50-500KB depending on content

---

## Performance Considerations

### 1. Optimize Database Queries

✅ **DO**:
```typescript
// Single query with JOIN
const data = await sql`
  SELECT 
    e.*,
    c.name as customer_name,
    c.email as customer_email
  FROM entities e
  LEFT JOIN customers c ON e.customer_id = c.id
  WHERE e.id = ${id}
`
```

❌ **DON'T**:
```typescript
// Multiple queries
const entity = await sql`SELECT * FROM entities WHERE id = ${id}`
const customer = await sql`SELECT * FROM customers WHERE id = ${entity.customer_id}`
```

### 2. Limit Data Fetching

✅ **DO**:
```typescript
// Only fetch needed fields
const items = await sql`
  SELECT id, description, quantity, unit_price, line_total
  FROM items
  WHERE entity_id = ${id}
  ORDER BY id ASC
`
```

❌ **DON'T**:
```typescript
// Fetch all fields including unnecessary ones
const items = await sql`
  SELECT *
  FROM items
  WHERE entity_id = ${id}
`
```

### 3. Cache Static Content

✅ **DO**:
```typescript
// Cache company info
const COMPANY_INFO = {
  name: "PT PELAYARAN NUSANTARA",
  address: "Jl. Pelabuhan Raya No. 123",
  phone: "(021) 1234-5678",
  email: "info@pelayarannusantara.com",
}
```

❌ **DON'T**:
```typescript
// Fetch from database every time
const company = await sql`SELECT * FROM company_settings`
```

### 4. Stream Large Files

✅ **DO**:
```typescript
// For very large PDFs, stream directly
const pdfStream = await renderToStream(<PDF />)
return new Response(pdfStream, {
  headers: { "Content-Type": "application/pdf" },
})
```

❌ **DON'T**:
```typescript
// Buffer entire file in memory for large files
const buffer = await convertStreamToBuffer(pdfStream)
return new Response(buffer)
```

### 5. Implement Caching

```typescript
// Cache generated PDFs for X minutes
import { unstable_cache } from "next/cache"

const getCachedPDF = unstable_cache(
  async (id: number) => {
    return await generatePDF(id)
  },
  ["entity-pdf"],
  {
    revalidate: 300, // 5 minutes
    tags: [`entity-${id}`],
  }
)
```

### 6. Optimize Images

✅ **DO**:
```typescript
// Compress and resize logo
<Image
  src="/logo.png"
  style={{ width: 150, height: 50 }}
/>
```

❌ **DON'T**:
```typescript
// Use full-size image
<Image
  src="/logo-4k.png" // 5MB file!
  style={{ width: 150, height: 50 }}
/>
```

### 7. Pagination for Large Tables

✅ **DO**:
```typescript
// For documents with many items, paginate
if (items.length > 50) {
  // Split into multiple pages
  const pages = Math.ceil(items.length / 50)
  // Generate multiple pages
}
```

### 8. Async Processing for Heavy Documents

```typescript
// For very complex documents, use queue
import { Queue } from "bull"

const pdfQueue = new Queue("pdf-generation")

export async function POST(request: Request) {
  const { entityId } = await request.json()
  
  // Add to queue
  const job = await pdfQueue.add({ entityId })
  
  return NextResponse.json({
    jobId: job.id,
    status: "processing",
  })
}

// Worker processes the queue
pdfQueue.process(async (job) => {
  const { entityId } = job.data
  const pdf = await generatePDF(entityId)
  // Save to storage
  await savePDF(entityId, pdf)
})
```

---

## Troubleshooting

### Issue 1: PDF Not Downloading

**Symptoms**: Button clicks but nothing happens

**Possible Causes**:
1. Browser popup blocker
2. CORS issues
3. Network error
4. Server error

**Solutions**:
```typescript
// Add better error handling
const handleDownload = async () => {
  try {
    const response = await fetch(`/api/entities/${id}/pdf`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Download failed")
    }
    
    const blob = await response.blob()
    
    // Check blob size
    if (blob.size === 0) {
      throw new Error("Empty file received")
    }
    
    // ... rest of download logic
  } catch (error) {
    console.error("Download error:", error)
    alert(`Error: ${error.message}`)
  }
}
```

### Issue 2: Corrupted PDF/DOCX

**Symptoms**: File downloads but won't open

**Possible Causes**:
1. Incorrect buffer conversion
2. Wrong content-type header
3. Incomplete stream reading

**Solutions**:
```typescript
// Ensure complete buffer conversion
const chunks: Buffer[] = []
for await (const chunk of stream) {
  chunks.push(Buffer.from(chunk))
}
const buffer = Buffer.concat(chunks)

// Verify buffer
if (buffer.length === 0) {
  throw new Error("Empty buffer generated")
}

// Correct headers
return new NextResponse(buffer, {
  headers: {
    "Content-Type": "application/pdf", // Correct type
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": buffer.length.toString(),
  },
})
```

### Issue 3: Layout Issues

**Symptoms**: Text overflow, misaligned elements

**Solutions**:
```typescript
// Use percentage widths
tableCol1: { width: "10%" },
tableCol2: { width: "40%" },

// Add text wrapping
description: {
  width: "70%",
  wordWrap: "break-word",
},

// Limit text length
const truncate = (text: string, maxLength: number) => {
  return text.length > maxLength
    ? text.substring(0, maxLength) + "..."
    : text
}
```

### Issue 4: Slow Generation

**Symptoms**: Takes > 5 seconds to generate

**Solutions**:
```typescript
// 1. Optimize queries
// 2. Reduce data fetching
// 3. Implement caching
// 4. Use pagination
// 5. Profile with console.time

console.time("pdf-generation")
const pdf = await generatePDF(id)
console.timeEnd("pdf-generation")
```

### Issue 5: Memory Issues

**Symptoms**: Server crashes with large documents

**Solutions**:
```typescript
// 1. Stream instead of buffer
// 2. Implement pagination
// 3. Increase Node.js memory
// node --max-old-space-size=4096 server.js

// 4. Clean up resources
const cleanup = () => {
  if (global.gc) {
    global.gc()
  }
}
```

### Issue 6: TypeScript Errors

**Symptoms**: Build fails with type errors

**Solutions**:
```typescript
// Ensure correct types
import type { NextRequest } from "next/server"

// Use proper interfaces
interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params
  // ...
}
```

---

## Quick Start Checklist

When implementing PDF/DOCX export for a new entity:

### Step 1: Setup
- [ ] Install dependencies (`@react-pdf/renderer`, `docx`)
- [ ] Create folder structure
- [ ] Define TypeScript interfaces

### Step 2: PDF Implementation
- [ ] Create PDF template component
- [ ] Define StyleSheet
- [ ] Implement company header
- [ ] Implement data sections
- [ ] Implement tables
- [ ] Implement footer
- [ ] Create PDF API route
- [ ] Test PDF generation

### Step 3: DOCX Implementation
- [ ] Create DOCX API route
- [ ] Implement company header
- [ ] Implement data sections
- [ ] Implement tables
- [ ] Implement footer
- [ ] Test DOCX generation

### Step 4: UI Integration
- [ ] Add download buttons
- [ ] Implement loading states
- [ ] Add error handling
- [ ] Test user flow

### Step 5: Testing
- [ ] Manual testing (all browsers)
- [ ] Error scenarios
- [ ] Performance testing
- [ ] Edge cases

### Step 6: Documentation
- [ ] Update API documentation
- [ ] Add user guide
- [ ] Document customization options

---

## Conclusion

Dokumen ini menyediakan referensi lengkap untuk implementasi fitur ekspor PDF dan DOCX. Gunakan template dan pattern yang telah terbukti berhasil pada Quotation Export Feature untuk memastikan konsistensi dan kualitas di seluruh aplikasi.

**Key Takeaways**:
1. Gunakan pattern yang sudah terbukti
2. Maintain konsistensi styling antara PDF dan DOCX
3. Implement error handling yang robust
4. Optimize untuk performance
5. Test secara menyeluruh
6. Document dengan baik

**Reference Implementation**: `nas/src/app/api/quotations/[id]/` dan `nas/src/lib/pdf/quotation-template.tsx`

---

**Document Version**: 1.0  
**Last Updated**: 8 Februari 2026  
**Maintained By**: Development Team  
**Status**: Production Ready ✅
