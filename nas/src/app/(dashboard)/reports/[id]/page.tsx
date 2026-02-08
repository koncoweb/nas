"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import {
  IconArrowLeft,
  IconCheck,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react"

interface ReportDetailPageProps {
  params: Promise<{
    id: string
  }>
}

interface Report {
  id: number
  project_id: number
  project_number: string
  project_title: string
  customer_name: string
  completion_date: string
  work_summary: string
  materials_used: string
  customer_signature_url?: string
  status: "pending" | "customer_signed" | "completed"
  created_at: string
  updated_at: string
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`)
      if (!response.ok) throw new Error("Failed to fetch report")
      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError("Failed to load report. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [id])

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this report?")) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${id}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve report")
      }

      await fetchReport()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report?")) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete report")
      }

      router.push("/reports")
    } catch (err: any) {
      setError(err.message)
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

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Report not found</p>
        <Link href="/reports">
          <Button className="mt-4">Back to Reports</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "customer_signed":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const canApprove = report.status === "customer_signed"
  const canEdit = report.status === "pending"
  const canDelete = report.status === "pending"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Back to Reports
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Report #{report.id}
          </h1>
          <p className="text-muted-foreground">Project Completion Report</p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <IconCheck className="w-4 h-4 mr-2" />
              Approve Report
            </Button>
          )}
          {canDelete && (
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              variant="destructive"
            >
              <IconTrash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Report Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Completion Date
              </div>
              <div className="font-medium">
                {formatDate(report.completion_date)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created At</div>
              <div className="font-medium">{formatDate(report.created_at)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Project</div>
              <Link
                href={`/projects/${report.project_id}`}
                className="font-medium text-primary hover:underline"
              >
                {report.project_number} - {report.project_title}
              </Link>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{report.customer_name}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Work Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">{report.work_summary}</div>
        </CardContent>
      </Card>

      {/* Materials Used */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">
            {report.materials_used}
          </div>
        </CardContent>
      </Card>

      {/* Customer Signature */}
      {report.customer_signature_url && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={report.customer_signature_url}
              alt="Customer Signature"
              className="max-w-md border rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
