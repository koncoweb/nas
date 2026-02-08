"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface DashboardStats {
  activeProjects: number
  planningProjects: number
  completedProjects: number
  draftQuotations: number
  pendingQuotations: number
  approvedQuotations: number
  pendingMaterialRequests: number
  underReviewRequests: number
  approvedRequests: number
}

interface RecentActivity {
  type: "quotation" | "project" | "invoice"
  id: number
  name: string
  status: string
  created_at: string
  updated_at: string
}

interface ApprovalItem {
  type: "material_request" | "project_report"
  id: number
  name: string
  status: string
  urgency?: string
  created_at: string
  project_title: string
}

interface DashboardData {
  statistics: DashboardStats
  recentActivities: RecentActivity[]
  approvalItems: ApprovalItem[]
  userRole: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard")
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch dashboard data")
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "text-gray-600",
      sent: "text-blue-600",
      approved: "text-green-600",
      rejected: "text-red-600",
      planning: "text-yellow-600",
      in_progress: "text-blue-600",
      completed: "text-green-600",
      submitted: "text-blue-600",
      under_review: "text-yellow-600",
      partial: "text-yellow-600",
      paid: "text-green-600"
    }
    return statusColors[status] || "text-gray-600"
  }

  const getUrgencyColor = (urgency?: string) => {
    if (!urgency) return "text-gray-600"
    const urgencyColors: Record<string, string> = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-red-600"
    }
    return urgencyColors[urgency] || "text-gray-600"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getQuickActions = (role: string) => {
    const actions: Record<string, Array<{ label: string; path: string }>> = {
      leader: [
        { label: "View Projects", path: "/projects" },
        { label: "Review Material Requests", path: "/material-requests" },
        { label: "View Reports", path: "/reports" }
      ],
      sales: [
        { label: "Create Quotation", path: "/quotations/new" },
        { label: "View Customers", path: "/customers" },
        { label: "View Quotations", path: "/quotations" }
      ],
      accounting: [
        { label: "Create Invoice", path: "/invoices/new" },
        { label: "View Invoices", path: "/invoices" },
        { label: "View Projects", path: "/projects" }
      ],
      engineer: [
        { label: "View Projects", path: "/projects" },
        { label: "Create Material Request", path: "/material-requests/new" },
        { label: "View Materials", path: "/materials" }
      ]
    }
    return actions[role] || []
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { statistics, recentActivities, approvalItems, userRole } = data

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.planningProjects} planning, {statistics.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pendingQuotations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.draftQuotations} drafts, {statistics.approvedQuotations} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Material Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pendingMaterialRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.underReviewRequests} under review, {statistics.approvedRequests} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getQuickActions(userRole).map((action) => (
              <Button
                key={action.path}
                variant="outline"
                onClick={() => router.push(action.path)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.type === "quotation" && "Quotation: "}
                        {activity.type === "project" && "Project: "}
                        {activity.type === "invoice" && "Invoice: "}
                        {activity.name}
                      </p>
                      <p className={`text-sm ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.updated_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const paths: Record<string, string> = {
                          quotation: "/quotations",
                          project: "/projects",
                          invoice: "/invoices"
                        }
                        router.push(`${paths[activity.type]}/${activity.id}`)
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval Queue (Leaders only) */}
        {userRole === "leader" && (
          <Card>
            <CardHeader>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>Items requiring your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items pending approval</p>
                ) : (
                  approvalItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {item.type === "material_request" && "Material Request: "}
                          {item.type === "project_report" && "Project Report: "}
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Project: {item.project_title}
                        </p>
                        {item.urgency && (
                          <p className={`text-xs font-medium ${getUrgencyColor(item.urgency)}`}>
                            {item.urgency.toUpperCase()} priority
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const paths: Record<string, string> = {
                            material_request: "/material-requests",
                            project_report: "/reports"
                          }
                          router.push(`${paths[item.type]}/${item.id}`)
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
