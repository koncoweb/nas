"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MaterialRequestTable } from "@/components/material-requests/MaterialRequestTable"
import { Pagination } from "@/components/shared/Pagination"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { IconPlus } from "@tabler/icons-react"

interface MaterialRequest {
  id: number
  project_id: number
  requested_by: string
  request_type: "purchase" | "warehouse"
  title: string
  urgency: "low" | "medium" | "high"
  estimated_total_cost: number
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected"
  created_at: Date
  updated_at: Date
  project_title?: string
  project_number?: string
  requested_by_name?: string
}

interface Project {
  id: number
  project_number: string
  title: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function MaterialRequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [projectFilter, setProjectFilter] = useState(searchParams.get("project_id") || "all")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [urgencyFilter, setUrgencyFilter] = useState(searchParams.get("urgency") || "all")
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchMaterialRequests()
    fetchProjects()
  }, [page, searchQuery, projectFilter, statusFilter, urgencyFilter])

  const fetchMaterialRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      })

      if (searchQuery) params.append("search", searchQuery)
      if (projectFilter && projectFilter !== "all") params.append("project_id", projectFilter)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      if (urgencyFilter && urgencyFilter !== "all") params.append("urgency", urgencyFilter)

      const response = await fetch(`/api/material-requests?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch material requests")

      const data = await response.json()
      setMaterialRequests(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch material requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data.data)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleProjectFilter = (value: string) => {
    setProjectFilter(value)
    setPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleUrgencyFilter = (value: string) => {
    setUrgencyFilter(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Material Requests</h1>
          <p className="text-muted-foreground">
            Manage material requests for projects
          </p>
        </div>
        <Link href="/material-requests/new">
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <Select value={projectFilter} onValueChange={handleProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.project_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={urgencyFilter} onValueChange={handleUrgencyFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Urgencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgencies</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <MaterialRequestTable materialRequests={materialRequests} />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
