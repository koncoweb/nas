"use client"

import { DataTable, Column } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { IconEye, IconEdit } from "@tabler/icons-react"
import { format } from "date-fns"
import type { Project } from "@/types"

// Extended project type with joined fields for display
interface ProjectWithDetails extends Project {
  customer_name?: string
  engineer_name?: string | null
}

interface ProjectTableProps {
  projects: ProjectWithDetails[]
  loading?: boolean
  pagination?: {
    page: number
    totalPages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
  onSearch?: (query: string) => void
  onView?: (project: ProjectWithDetails) => void
  onEdit?: (project: ProjectWithDetails) => void
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

export function ProjectTable({
  projects,
  loading = false,
  pagination,
  onSearch,
  onView,
  onEdit,
}: ProjectTableProps) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return "-"
    try {
      return format(new Date(date), "MMM dd, yyyy")
    } catch {
      return "-"
    }
  }

  const columns: Column<ProjectWithDetails>[] = [
    {
      key: "project_number",
      label: "Project #",
      sortable: true,
      render: (project) => (
        <span className="font-mono text-sm">{project.project_number}</span>
      ),
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "customer_name",
      label: "Customer",
      sortable: true,
    },
    {
      key: "engineer_name",
      label: "Engineer",
      sortable: false,
      render: (project) => project.engineer_name || "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (project) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[project.status]
          }`}
        >
          {statusLabels[project.status]}
        </span>
      ),
    },
    {
      key: "start_date",
      label: "Start Date",
      sortable: true,
      render: (project) => formatDate(project.start_date),
    },
    {
      key: "expected_completion",
      label: "Expected Completion",
      sortable: true,
      render: (project) => formatDate(project.expected_completion),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (project) => (
        <div className="flex items-center gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onView(project)
              }}
              title="View details"
            >
              <IconEye className="w-4 h-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project)
              }}
              title="Edit project"
            >
              <IconEdit className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={projects}
      columns={columns}
      searchable
      searchPlaceholder="Search by project number, title, or customer..."
      onSearch={onSearch}
      pagination={pagination}
      loading={loading}
      emptyMessage="No projects found"
    />
  )
}
