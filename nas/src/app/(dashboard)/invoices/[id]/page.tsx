"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InvoiceLineItemsTable } from "@/components/invoices/InvoiceLineItemsTable"
import { PaymentForm } from "@/components/invoices/PaymentForm"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Invoice, InvoiceLineItem } from "@/types"
import {
  IconArrowLeft,
  IconSend,
} from "@tabler/icons-react"

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<
    (Invoice & {
      customer_name?: string
      customer_email?: string
      customer_phone?: string
      customer_address?: string
      project_number?: string
      project_title?: string
      line_items?: InvoiceLineItem[]
    }) | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`)
      if (!response.ok) throw new Error("Failed to fetch invoice")
      const data = await response.json()
      setInvoice(data)
    } catch (err) {
      setError("Failed to load invoice. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const handleAddLineItem = async (
    item: Omit<InvoiceLineItem, "id" | "invoice_id" | "line_total">
  ) => {
    try {
      const response = await fetch(`/api/invoices/${id}/line-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (!response.ok) throw new Error("Failed to add line item")

      await fetchInvoice()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleEditLineItem = async (
    itemId: number,
    item: Partial<InvoiceLineItem>
  ) => {
    try {
      const response = await fetch(`/api/invoices/${id}/line-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, id: itemId }),
      })

      if (!response.ok) throw new Error("Failed to update line item")

      await fetchInvoice()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleDeleteLineItem = async (itemId: number) => {
    try {
      const response = await fetch(
        `/api/invoices/${id}/line-items?itemId=${itemId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Failed to delete line item")

      await fetchInvoice()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleRecordPayment = async (payment: {
    amount: number
    payment_date: Date
    payment_method?: string
    notes?: string
  }) => {
    try {
      const response = await fetch(`/api/invoices/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record payment")
      }

      await fetchInvoice()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`))
      return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update status")
      }

      await fetchInvoice()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Link href="/invoices">
          <Button className="mt-4">Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const canEdit = invoice.status === "draft"
  const canSend = invoice.status === "draft" && (invoice.line_items?.length || 0) > 0
  const canRecordPayment = invoice.status === "sent" || invoice.status === "pending"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/invoices"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground">Invoice Details</p>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <Button
              onClick={() => handleStatusChange("sent")}
              disabled={actionLoading}
            >
              <IconSend className="w-4 h-4 mr-2" />
              Send Invoice
            </Button>
          )}
          {canRecordPayment && (
            <PaymentForm
              invoiceId={invoice.id}
              totalAmount={invoice.total_amount}
              amountPaid={invoice.amount_paid || 0}
              onSubmit={handleRecordPayment}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Invoice Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created Date</div>
              <div className="font-medium">{formatDate(invoice.created_at)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="font-medium">{formatDate(invoice.due_date)}</div>
            </div>
            {invoice.project_number && (
              <div>
                <div className="text-sm text-muted-foreground">Project</div>
                <Link
                  href={`/projects/${invoice.project_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {invoice.project_number} - {invoice.project_title}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Company</div>
              <Link
                href={`/customers/${invoice.customer_id}`}
                className="font-medium text-primary hover:underline"
              >
                {invoice.customer_name}
              </Link>
            </div>
            {invoice.customer_email && (
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="text-sm">{invoice.customer_email}</div>
              </div>
            )}
            {invoice.customer_phone && (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="text-sm">{invoice.customer_phone}</div>
              </div>
            )}
            {invoice.customer_address && (
              <div>
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="text-sm whitespace-pre-line">
                  {invoice.customer_address}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold">${Number(invoice.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-green-600">
                ${Number(invoice.amount_paid || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xl pt-2 border-t">
              <span className="font-semibold">Remaining Balance:</span>
              <span className="font-bold text-orange-600">
                ${(Number(invoice.total_amount) - Number(invoice.amount_paid || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItemsTable
            invoiceId={invoice.id}
            lineItems={invoice.line_items || []}
            onAdd={handleAddLineItem}
            onEdit={handleEditLineItem}
            onDelete={handleDeleteLineItem}
            readonly={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
