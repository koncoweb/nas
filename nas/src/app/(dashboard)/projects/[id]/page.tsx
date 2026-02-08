"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IconArrowLeft,
  IconEdit,
  IconUser,
  IconCalendar,
  IconFileText,
  IconCurrencyDollar,
  IconPackage,
  IconReceipt,
  IconClipboardCheck,
  IconPlus,
  IconFilter,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { CostForm } from "@/components/costs/CostForm"
import { CostsTable } from "@/components/costs/CostsTable"
import { ReportForm } from "@/components/reports/ReportForm"
import { ReportsTable } from "@/components/reports/ReportsTable"
import { ProjectCost, ProjectReport } from "@/types"

interface ProjectDetail {
  id: number
  project_number: string
  quotation_id: number | null
  customer_id: number
  title: string
  description: string | null
  status: "planning" | "in_progress" | "completed"
  assigned_engineer: string | null
  start_date: string | null
  expected_completion: string | null
  actual_completion: string | null
  created_at: string
  updated_at: string
  customer_name: string
  customer_contact: string
  customer_email: string
  customer_phone: string
  engineer_name: string | null
  engineer_email: string | null
  quotation: any
  costs: any[]
  costSummary: any[]
  materialRequests: any[]
  invoices: any[]
  reports: any[]
}

const statusColors = {
  planning: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
}

const statusLabels = {
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showCostModal, setShowCostModal] = useState(false)
  const [editingCost, setEditingCost] = useState<ProjectCost | null>(null)
  const [costs, setCosts] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [costFilters, setCostFilters] = useState({
    cost_type: "all",
    start_date: "",
    end_date: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [userRole, setUserRole] = useState<string>("")

  const fetchProject = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch project")
      }
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCosts = async () => {
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        ...(costFilters.cost_type && { cost_type: costFilters.cost_type }),
        ...(costFilters.start_date && { start_date: costFilters.start_date }),
        ...(costFilters.end_date && { end_date: costFilters.end_date }),
      })

      const response = await fetch(`/api/costs?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch costs")
      }
      const data = await response.json()
      setCosts(data.data || [])
    } catch (error) {
      console.error("Error fetching costs:", error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials?limit=1000")
      if (!response.ok) {
        throw new Error("Failed to fetch materials")
      }
      const data = await response.json()
      setMaterials(data.data || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?project_id=${projectId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }
      const data = await response.json()
      setReports(data.data || [])
    } catch (error) {
      console.error("Error fetching reports:", error)
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const session = await response.json()
        setUserRole(session?.user?.role || "")
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
    }
  }

  useEffect(() => {
    fetchProject()
    fetchMaterials()
    fetchReports()
    fetchUserRole()
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchCosts()
    }
  }, [projectId, costFilters])

  const handleCreateCost = async (costData: any) => {
    try {
      const response = await fetch("/api/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create cost")
      }

      setShowCostModal(false)
      await fetchCosts()
      await fetchProject()
      alert("Cost created successfully")
    } catch (error) {
      console.error("Failed to create cost:", error)
      alert(error instanceof Error ? error.message : "Failed to create cost")
    }
  }

  const handleUpdateCost = async (costData: any) => {
    if (!editingCost) return

    try {
      const response = await fetch(`/api/costs/${editingCost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update cost")
      }

      setShowCostModal(false)
      setEditingCost(null)
      await fetchCosts()
      await fetchProject()
      alert("Cost updated successfully")
    } catch (error) {
      console.error("Failed to update cost:", error)
      alert(error instanceof Error ? error.message : "Failed to update cost")
    }
  }

  const handleDeleteCost = async (costId: number) => {
    if (!confirm("Are you sure you want to delete this cost?")) return

    try {
      const response = await fetch(`/api/costs/${costId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete cost")
      }

      await fetchCosts()
      await fetchProject()
      alert("Cost deleted successfully")
    } catch (error) {
      console.error("Failed to delete cost:", error)
      alert(error instanceof Error ? error.message : "Failed to delete cost")
    }
  }

  const handleEditCost = (cost: ProjectCost) => {
    setEditingCost(cost)
    setShowCostModal(true)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update status")
      }

      await fetchProject()
    } catch (error) {
      console.error("Failed to update status:", error)
      alert(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateReport = async (reportData: any) => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create report")
      }

      setShowReportModal(false)
      await fetchReports()
      await fetchProject()
      alert("Report created successfully")
    } catch (error) {
      console.error("Failed to create report:", error)
      alert(error instanceof Error ? error.message : "Failed to create report")
    }
  }

  const handleApproveReport = async (report: ProjectReport) => {
    if (!confirm("Are you sure you want to approve this report? This will mark the project as completed.")) return

    try {
      const response = await fetch(`/api/reports/${report.id}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to approve report")
      }

      await fetchReports()
      await fetchProject()
      alert("Report approved and project marked as completed")
    } catch (error) {
      console.error("Failed to approve report:", error)
      alert(error instanceof Error ? error.message : "Failed to approve report")
    }
  }

  const handleViewReport = (report: ProjectReport) => {
    // For now, just show an alert. In a real app, this would open a detail view
    alert(`Viewing report: ${report.work_summary.substring(0, 100)}...`)
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push("/projects")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const totalCosts = project.costSummary?.reduce(
    (sum: number, item: any) => sum + parseFloat(item.total || 0),
    0
  ) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/projects")}
          >
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {project.project_number}
            </h1>
            <p className="text-muted-foreground">{project.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/edit`)}>
            <IconEdit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status and Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Current Status</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  statusColors[project.status]
                }`}
              >
                {statusLabels[project.status]}
              </span>
            </div>
            <div className="flex gap-2">
              {project.status === "planning" && (
                <Button
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={updating}
                >
                  Start Project
                </Button>
              )}
              {project.status === "in_progress" && (
                <Button
                  onClick={() => handleStatusChange("completed")}
                  disabled={updating}
                >
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{project.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="text-sm">{project.customer_contact}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm">{project.customer_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-sm">{project.customer_phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="w-5 h-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(project.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Completion</p>
              <p className="font-medium">{formatDate(project.expected_completion)}</p>
            </div>
            {project.actual_completion && (
              <div>
                <p className="text-sm text-muted-foreground">Actual Completion</p>
                <p className="font-medium">{formatDate(project.actual_completion)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(project.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engineer Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUser className="w-5 h-5" />
            Assigned Engineer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.engineer_name ? (
            <div className="space-y-2">
              <p className="font-medium">{project.engineer_name}</p>
              <p className="text-sm text-muted-foreground">{project.engineer_email}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No engineer assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="w-5 h-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Related Quotation */}
      {project.quotation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="w-5 h-5" />
              Related Quotation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{project.quotation.quote_number}</p>
                <p className="text-sm text-muted-foreground">{project.quotation.title}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/quotations/${project.quotation_id}`)}
              >
                View Quotation
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Labor Cost</p>
                <p className="font-medium">{formatCurrency(parseFloat(project.quotation.labor_cost))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Materials Cost</p>
                <p className="font-medium">{formatCurrency(parseFloat(project.quotation.materials_cost))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium">{formatCurrency(parseFloat(project.quotation.total_cost))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Costs - Enhanced Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconCurrencyDollar className="w-5 h-5" />
                Project Costs
              </CardTitle>
              <CardDescription>
                Total: {formatCurrency(totalCosts)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <IconFilter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCost(null)
                  setShowCostModal(true)
                }}
              >
                <IconPlus className="w-4 h-4 mr-2" />
                Add Cost
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-cost-type">Cost Type</Label>
                  <Select
                    value={costFilters.cost_type}
                    onValueChange={(value) =>
                      setCostFilters((prev) => ({ ...prev, cost_type: value }))
                    }
                  >
                    <SelectTrigger id="filter-cost-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-start-date">Start Date</Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={costFilters.start_date}
                    onChange={(e) =>
                      setCostFilters((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-end-date">End Date</Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={costFilters.end_date}
                    onChange={(e) =>
                      setCostFilters((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCostFilters({ cost_type: "", start_date: "", end_date: "" })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Cost Summary by Type */}
          {project.costSummary && project.costSummary.length > 0 && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              {project.costSummary.map((item: any, index: number) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-muted-foreground capitalize">{item.cost_type}</p>
                  <p className="text-lg font-semibold">{formatCurrency(parseFloat(item.total))}</p>
                  <p className="text-xs text-muted-foreground">{item.count} entries</p>
                </div>
              ))}
            </div>
          )}

          {/* Costs Table */}
          <CostsTable
            costs={costs}
            onEdit={handleEditCost}
            onDelete={handleDeleteCost}
            groupByCostType={true}
            showRunningTotal={true}
          />
        </CardContent>
      </Card>

      {/* Cost Modal */}
      <Dialog open={showCostModal} onOpenChange={setShowCostModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCost ? "Edit Cost" : "Add New Cost"}
            </DialogTitle>
          </DialogHeader>
          <CostForm
            projectId={parseInt(projectId)}
            materials={materials}
            initialData={
              editingCost
                ? {
                    ...editingCost,
                    material_id: editingCost.material_id ?? undefined,
                    quantity: editingCost.quantity ?? undefined,
                    unit_cost: editingCost.unit_cost ?? undefined,
                    vendor: editingCost.vendor ?? undefined,
                  }
                : undefined
            }
            onSubmit={editingCost ? handleUpdateCost : handleCreateCost}
            onCancel={() => {
              setShowCostModal(false)
              setEditingCost(null)
            }}
            submitLabel={editingCost ? "Update Cost" : "Create Cost"}
          />
        </DialogContent>
      </Dialog>

      {/* Material Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="w-5 h-5" />
            Material Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.materialRequests && project.materialRequests.length > 0 ? (
            <div className="space-y-3">
              {project.materialRequests.map((request: any) => (
                <div key={request.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.request_type} • {request.urgency} urgency
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : request.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No material requests yet</p>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconReceipt className="w-5 h-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.invoices && project.invoices.length > 0 ? (
            <div className="space-y-3">
              {project.invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(parseFloat(invoice.total_amount))}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No invoices yet</p>
          )}
        </CardContent>
      </Card>

      {/* Project Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconClipboardCheck className="w-5 h-5" />
                Project Reports
              </CardTitle>
              <CardDescription>
                Completion reports and documentation
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowReportModal(true)}
            >
              <IconPlus className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ReportsTable
            reports={reports}
            onView={handleViewReport}
            onApprove={handleApproveReport}
            canApprove={userRole === "leader"}
          />
        </CardContent>
      </Card>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Project Report</DialogTitle>
          </DialogHeader>
          {project && (
            <ReportForm
              project={project}
              onSubmit={handleCreateReport}
              onCancel={() => setShowReportModal(false)}
              submitLabel="Create Report"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
