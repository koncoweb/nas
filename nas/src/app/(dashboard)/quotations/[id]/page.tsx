"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineItemsTable } from "@/components/quotations/LineItemsTable"
import { ScopeOfWorkForm } from "@/components/quotations/ScopeOfWorkForm"
import { Quotation, QuotationLineItem, QuotationScopeWork, Material } from "@/types"
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconSend,
  IconCheck,
  IconX,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconDownload,
} from "@tabler/icons-react"

export default function QuotationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quotationId = parseInt(params.id as string)

  const [quotation, setQuotation] = useState<any>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)

  useEffect(() => {
    fetchQuotation()
    fetchMaterials()
  }, [quotationId])

  const fetchQuotation = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`)
      if (!response.ok) throw new Error("Failed to fetch quotation")
      const data = await response.json()
      setQuotation(data)
    } catch (error) {
      console.error("Failed to fetch quotation:", error)
      alert("Failed to load quotation")
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch materials")
      const data = await response.json()
      setMaterials(data.data)
    } catch (error) {
      console.error("Failed to fetch materials:", error)
    }
  }

  const handleAddLineItem = async (
    item: Omit<QuotationLineItem, "id" | "quotation_id" | "line_total">
  ) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/line-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to add line item")
      }
      
      await fetchQuotation()
    } catch (error) {
      console.error("Failed to add line item:", error)
      throw error
    }
  }

  const handleEditLineItem = async (
    id: number,
    item: Partial<QuotationLineItem>
  ) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/line-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_item_id: id, ...item }),
      })

      if (!response.ok) throw new Error("Failed to edit line item")
      await fetchQuotation()
    } catch (error) {
      console.error("Failed to edit line item:", error)
      throw error
    }
  }

  const handleDeleteLineItem = async (id: number) => {
    try {
      const response = await fetch(
        `/api/quotations/${quotationId}/line-items?line_item_id=${id}`,
        { method: "DELETE" }
      )

      if (!response.ok) throw new Error("Failed to delete line item")
      await fetchQuotation()
    } catch (error) {
      console.error("Failed to delete line item:", error)
      throw error
    }
  }

  const handleAddScopeWork = async (
    item: Omit<QuotationScopeWork, "id" | "quotation_id">
  ) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/scope-work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (!response.ok) throw new Error("Failed to add scope of work item")
      await fetchQuotation()
    } catch (error) {
      console.error("Failed to add scope of work item:", error)
      throw error
    }
  }

  const handleEditScopeWork = async (
    id: number,
    item: Partial<QuotationScopeWork>
  ) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/scope-work`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope_work_id: id, ...item }),
      })

      if (!response.ok) throw new Error("Failed to edit scope of work item")
      await fetchQuotation()
    } catch (error) {
      console.error("Failed to edit scope of work item:", error)
      throw error
    }
  }

  const handleDeleteScopeWork = async (id: number) => {
    try {
      const response = await fetch(
        `/api/quotations/${quotationId}/scope-work?scope_work_id=${id}`,
        { method: "DELETE" }
      )

      if (!response.ok) throw new Error("Failed to delete scope of work item")
      await fetchQuotation()
    } catch (error) {
      console.error("Failed to delete scope of work item:", error)
      throw error
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update status")
      }

      await fetchQuotation()
    } catch (error) {
      console.error("Failed to update status:", error)
      alert(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quotation?")) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete quotation")
      }

      router.push("/quotations")
    } catch (error) {
      console.error("Failed to delete quotation:", error)
      alert(error instanceof Error ? error.message : "Failed to delete quotation")
      setActionLoading(false)
    }
  }

  const handleConvertToProject = async () => {
    if (!confirm("Convert this quotation to a project?")) return

    setConverting(true)
    try {
      const response = await fetch(`/api/quotations/${quotationId}/convert-to-project`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to convert to project")
      }

      const data = await response.json()
      alert("Quotation converted to project successfully!")
      router.push(`/projects/${data.project.id}`)
    } catch (error) {
      console.error("Failed to convert to project:", error)
      alert(error instanceof Error ? error.message : "Failed to convert to project")
    } finally {
      setConverting(false)
    }
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const response = await fetch(`/api/quotations/${quotationId}/pdf`)
      if (!response.ok) {
        throw new Error("Gagal mengunduh PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quotation-${quotation.quote_number}.pdf`
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
      const response = await fetch(`/api/quotations/${quotationId}/docx`)
      if (!response.ok) {
        throw new Error("Gagal mengunduh DOCX")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quotation-${quotation.quote_number}.docx`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quotation not found</p>
        <Link href="/quotations">
          <Button className="mt-4">Back to Quotations</Button>
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  const canEdit = quotation.status === "draft"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotations">
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {quotation.quote_number}
            </h1>
            <p className="text-muted-foreground">{quotation.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Download Buttons */}
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

          {/* Action Buttons */}
          {quotation.status === "approved" && (
            <Button
              onClick={handleConvertToProject}
              disabled={converting}
              variant="default"
            >
              <IconCheck className="w-4 h-4 mr-2" />
              Convert to Project
            </Button>
          )}
          {quotation.status === "draft" && (
            <Button
              onClick={() => handleStatusChange("sent")}
              disabled={actionLoading}
            >
              <IconSend className="w-4 h-4 mr-2" />
              Send to Customer
            </Button>
          )}
          {quotation.status === "sent" && (
            <>
              <Button
                onClick={() => handleStatusChange("approved")}
                disabled={actionLoading}
                variant="default"
              >
                <IconCheck className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleStatusChange("rejected")}
                disabled={actionLoading}
                variant="destructive"
              >
                <IconX className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {canEdit && (
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              variant="outline"
            >
              <IconTrash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Quotation Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[quotation.status]
                }`}
              >
                {quotation.status.charAt(0).toUpperCase() +
                  quotation.status.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{quotation.company_name}</p>
              <p className="text-sm">{quotation.contact_name}</p>
              <p className="text-sm">{quotation.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{quotation.description || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">
                {new Date(quotation.created_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Labor Hours:</span>
              <span className="font-medium">{quotation.labor_hours} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Labor Rate:</span>
              <span className="font-medium">
                ${parseFloat(quotation.labor_rate).toFixed(2)}/hr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Labor Cost:</span>
              <span className="font-medium">
                ${parseFloat(quotation.labor_cost).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Materials Cost:
              </span>
              <span className="font-medium">
                ${parseFloat(quotation.materials_cost).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Profit Margin:
              </span>
              <span className="font-medium">
                {(parseFloat(quotation.profit_margin) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-semibold">Total Cost:</span>
              <span className="font-bold text-lg">
                ${parseFloat(quotation.total_cost).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <LineItemsTable
            quotationId={quotationId}
            lineItems={quotation.line_items || []}
            materials={materials}
            onAdd={handleAddLineItem}
            onEdit={handleEditLineItem}
            onDelete={handleDeleteLineItem}
            readonly={!canEdit}
          />
        </CardContent>
      </Card>

      {/* Scope of Work */}
      <Card>
        <CardContent className="pt-6">
          <ScopeOfWorkForm
            quotationId={quotationId}
            scopeWork={quotation.scope_work || []}
            onAdd={handleAddScopeWork}
            onEdit={handleEditScopeWork}
            onDelete={handleDeleteScopeWork}
            readonly={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
