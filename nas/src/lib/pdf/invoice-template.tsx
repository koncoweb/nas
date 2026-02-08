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
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e40af",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "30%",
    fontWeight: "bold",
    color: "#374151",
  },
  value: {
    width: "70%",
    color: "#1f2937",
  },
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
  tableCol1: {
    width: "10%",
  },
  tableCol2: {
    width: "50%",
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
  totalsSection: {
    marginTop: 15,
    marginLeft: "auto",
    width: "50%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
    borderBottom: "1pt solid #e5e7eb",
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#374151",
  },
  totalValue: {
    color: "#1f2937",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 5,
  },
  paymentSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  balanceDue: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#fef3c7",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 5,
    borderRadius: 4,
  },
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
  statusPartial: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusPaid: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#374151",
  },
  notesText: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.4,
  },
})

interface InvoicePDFProps {
  invoice: {
    id: number
    invoice_number: string
    issue_date: string
    due_date: string
    total_amount: number
    amount_paid: number
    status: string
    notes: string | null
    customer_name: string
    contact_name: string
    customer_email: string
    customer_phone: string
    customer_address: string | null
    project_number: string | null
    project_title: string | null
  }
  lineItems: Array<{
    id: number
    description: string
    quantity: number
    unit_price: number
    line_total: number
  }>
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoice,
  lineItems,
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
      case "partial":
        return styles.statusPartial
      case "paid":
        return styles.statusPaid
      default:
        return styles.statusDraft
    }
  }

  const balanceDue = invoice.total_amount - invoice.amount_paid

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subtitle}>Invoice #{invoice.invoice_number}</Text>
          <Text style={styles.subtitle}>
            Issue Date: {formatDate(invoice.issue_date)}
          </Text>
          <Text style={styles.subtitle}>
            Due Date: {formatDate(invoice.due_date)}
          </Text>
          <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
            <Text>{invoice.status}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Company:</Text>
            <Text style={styles.value}>{invoice.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{invoice.contact_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{invoice.customer_email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{invoice.customer_phone}</Text>
          </View>
          {invoice.customer_address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{invoice.customer_address}</Text>
            </View>
          )}
        </View>

        {/* Project Information */}
        {invoice.project_number && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Project Number:</Text>
              <Text style={styles.value}>{invoice.project_number}</Text>
            </View>
            {invoice.project_title && (
              <View style={styles.row}>
                <Text style={styles.label}>Project Title:</Text>
                <Text style={styles.value}>{invoice.project_title}</Text>
              </View>
            )}
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>#</Text>
              <Text style={styles.tableCol2}>Description</Text>
              <Text style={styles.tableCol3}>Quantity</Text>
              <Text style={styles.tableCol4}>Unit Price</Text>
              <Text style={styles.tableCol5}>Total</Text>
            </View>
            {lineItems.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCol1}>{index + 1}</Text>
                <Text style={styles.tableCol2}>{item.description}</Text>
                <Text style={styles.tableCol3}>{item.quantity}</Text>
                <Text style={styles.tableCol4}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={styles.tableCol5}>
                  {formatCurrency(item.line_total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.totalsSection}>
          <View style={styles.grandTotal}>
            <Text>TOTAL AMOUNT:</Text>
            <Text>{formatCurrency(invoice.total_amount)}</Text>
          </View>
          
          {invoice.amount_paid > 0 && (
            <View style={styles.paymentSection}>
              <View style={styles.paymentRow}>
                <Text style={styles.totalLabel}>Amount Paid:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.amount_paid)}
                </Text>
              </View>
              <View style={styles.balanceDue}>
                <Text>BALANCE DUE:</Text>
                <Text>{formatCurrency(balanceDue)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
          <Text style={{ fontSize: 9, color: "#6b7280", lineHeight: 1.4 }}>
            Payment is due within 30 days of the invoice date. Please make
            checks payable to the company name and mail to the address on file.
            For wire transfers or other payment methods, please contact our
            accounting department.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>
            For questions about this invoice, please contact our accounting
            department.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
