"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCalendar, IconUser, IconFileText, IconArrowRight } from "@tabler/icons-react"
import { format } from "date-fns"
import type { Project } from "@/types"

// Extended project type with joined fields for display
interface ProjectWithDetails extends Project {
  customer_name?: string
  engineer_name?: string | null
}

interface ProjectCardProps {
  project: ProjectWithDetails
  onView?: (project: ProjectWithDetails) => void
}

const statusColors = {
  planning: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
}

const statusLabels = {
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
}

export function ProjectCard({ project, onView }: ProjectCardProps) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not set"
    try {
      return format(new Date(date), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-muted-foreground">
                {project.project_number}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                  statusColors[project.status]
                }`}
              >
                {statusLabels[project.status]}
              </span>
            </div>
            <CardTitle className="text-xl">{project.title}</CardTitle>
            <CardDescription className="mt-1">
              {project.customer_name}
            </CardDescription>
          </div>
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(project)}
              className="ml-2"
            >
              <IconArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="space-y-2">
          {project.assigned_engineer && (
            <div className="flex items-center gap-2 text-sm">
              <IconUser className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Engineer:</span>
              <span className="font-medium">
                {project.engineer_name || "Assigned"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <IconCalendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Start:</span>
            <span>{formatDate(project.start_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IconFileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Expected:</span>
            <span>{formatDate(project.expected_completion)}</span>
          </div>
          {project.status === "completed" && project.actual_completion && (
            <div className="flex items-center gap-2 text-sm">
              <IconFileText className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium text-green-600">
                {formatDate(project.actual_completion)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
