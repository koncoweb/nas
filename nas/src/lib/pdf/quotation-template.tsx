import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  companyHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "2pt solid #1e40af",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 1,
  },
  companyLogoSpace: {
    height: 40,
    marginBottom: 5,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 5,
    textAlign: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    fontSize: 9,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  header: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    width: "55%",
  },
  headerRight: {
    width: "40%",
    textAlign: "right",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 3,
    color: "#1e40af",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#1f2937",
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 2,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    fontSize: 9,
    color: "#374151",
  },
  value: {
    width: "65%",
    fontSize: 9,
    color: "#1f2937",
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 4,
    fontWeight: "bold",
    fontSize: 9,
    borderBottom: "1pt solid #d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    fontSize: 8,
    borderBottom: "1pt solid #e5e7eb",
  },
  tableCol1: {
    width: "10%",
  },
  tableCol2: {
    width: "40%",
  },
  tableCol3: {
    width: "15%",
  },
  tableCol4: {
    width: "15%",
  },
  tableCol5: {
    width: "20%",
    textAlign: "right",
  },
  scopeRow: {
    flexDirection: "row",
    padding: 3,
    fontSize: 9,
    borderBottom: "1pt solid #e5e7eb",
  },
  scopeStep: {
    width: "8%",
    fontWeight: "bold",
  },
  scopeDescription: {
    width: "75%",
  },
  scopeCategory: {
    width: "17%",
    fontSize: 8,
    color: "#6b7280",
  },
  totalsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
    borderBottom: "1pt solid #e5e7eb",
  },
  totalLabel: {
    fontSize: 9,
    color: "#374151",
    width: "70%",
  },
  totalValue: {
    fontSize: 9,
    color: "#1f2937",
    width: "30%",
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
    backgroundColor: "#1e40af",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 5,
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 7,
    borderTop: "1pt solid #e5e7eb",
    paddingTop: 5,
  },
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
  statusSent: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusApproved: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusRejected: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
})

interface QuotationPDFProps {
  quotation: {
    id: number
    quote_number: string
    title: string
    description: string | null
    labor_hours: number
    labor_rate: number
    materials_cost: number
    labor_cost: number
    total_cost: number
    profit_margin: number
    status: string
    created_at: string
    company_name: string
    contact_name: string
    email: string
    phone: string
    address: string | null
  }
  lineItems: Array<{
    id: number
    description: string
    quantity: number
    unit_price: number
    line_total: number
    material_name?: string | null
  }>
  scopeWork: Array<{
    id: number
    step_number: number
    description: string
    work_category: string | null
  }>
}

export const QuotationPDF: React.FC<QuotationPDFProps> = ({
  quotation,
  lineItems,
  scopeWork,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft":
        return styles.statusDraft
      case "sent":
        return styles.statusSent
      case "approved":
        return styles.statusApproved
      case "rejected":
        return styles.statusRejected
      default:
        return styles.statusDraft
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header - Our Company */}
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

        {/* Header - Quotation Info */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>PENAWARAN HARGA</Text>
            <Text style={styles.subtitle}>QUOTATION</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.subtitle}>No: {quotation.quote_number}</Text>
            <Text style={styles.subtitle}>
              Tanggal: {formatDate(quotation.created_at)}
            </Text>
            <View style={[styles.statusBadge, getStatusStyle(quotation.status)]}>
              <Text>{quotation.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Quote To - Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quote To / Kepada:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Perusahaan / Company:</Text>
            <Text style={styles.value}>{quotation.company_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kontak / Contact:</Text>
            <Text style={styles.value}>{quotation.contact_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{quotation.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telepon / Phone:</Text>
            <Text style={styles.value}>{quotation.phone}</Text>
          </View>
          {quotation.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Alamat / Address:</Text>
              <Text style={styles.value}>{quotation.address}</Text>
            </View>
          )}
        </View>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Proyek / Project Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Judul / Title:</Text>
            <Text style={styles.value}>{quotation.title}</Text>
          </View>
          {quotation.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Deskripsi / Description:</Text>
              <Text style={styles.value}>{quotation.description}</Text>
            </View>
          )}
        </View>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Material & Jasa / Materials & Services</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>No</Text>
                <Text style={styles.tableCol2}>Deskripsi / Description</Text>
                <Text style={styles.tableCol3}>Qty</Text>
                <Text style={styles.tableCol4}>Harga / Price</Text>
                <Text style={styles.tableCol5}>Total</Text>
              </View>
              {lineItems.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{index + 1}</Text>
                  <Text style={styles.tableCol2}>
                    {item.material_name || item.description}
                  </Text>
                  <Text style={styles.tableCol3}>{Number(item.quantity)}</Text>
                  <Text style={styles.tableCol4}>
                    {formatCurrency(Number(item.unit_price))}
                  </Text>
                  <Text style={styles.tableCol5}>
                    {formatCurrency(Number(item.line_total))}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Scope of Work */}
        {scopeWork.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lingkup Pekerjaan / Scope of Work</Text>
            {scopeWork.map((item) => (
              <View key={item.id} style={styles.scopeRow}>
                <Text style={styles.scopeStep}>{item.step_number}.</Text>
                <Text style={styles.scopeDescription}>{item.description}</Text>
                {item.work_category && (
                  <Text style={styles.scopeCategory}>{item.work_category}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Cost Summary */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Biaya Material / Materials Cost:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(Number(quotation.materials_cost))}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Biaya Tenaga Kerja / Labor ({quotation.labor_hours} jam @ {formatCurrency(Number(quotation.labor_rate))}/jam):
            </Text>
            <Text style={styles.totalValue}>
              {formatCurrency(Number(quotation.labor_cost))}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Subtotal:
            </Text>
            <Text style={styles.totalValue}>
              {formatCurrency(Number(quotation.materials_cost) + Number(quotation.labor_cost))}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Keuntungan / Profit ({(Number(quotation.profit_margin) * 100).toFixed(1)}%):
            </Text>
            <Text style={styles.totalValue}>
              {formatCurrency(
                (Number(quotation.materials_cost) + Number(quotation.labor_cost)) *
                  Number(quotation.profit_margin)
              )}
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>TOTAL HARGA / TOTAL PRICE</Text>
            <Text>{formatCurrency(Number(quotation.total_cost))}</Text>
          </View>
        </View>

        {/* Footer */}
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
            Thank you for considering our marine engineering services.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
