"use client"

import { ProjectReport } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconEye, IconCheck } from "@tabler/icons-react"

interface ReportsTableProps {
  reports: (ProjectReport & {
    project_number?: string
    project_title?: string
    customer_name?: string
  })[]
  onView?: (report: ProjectReport) => void
  onApprove?: (report: ProjectReport) => void
  canApprove?: boolean
}

export function ReportsTable({
  reports,
  onView,
  onApprove,
  canApprove = false,
}: ReportsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      submitted: "default",
      approved: "outline",
    }

    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
    }

    return (
      <Badge variant={variants[status] || "default"} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md">
        <p className="text-muted-foreground">No reports found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Completion Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{report.project_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {report.project_title}
                  </p>
                </div>
              </TableCell>
              <TableCell>{formatDate(report.completion_date)}</TableCell>
              <TableCell>{getStatusBadge(report.status)}</TableCell>
              <TableCell>{formatDate(report.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(report)}
                    >
                      <IconEye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  )}
                  {onApprove &&
                    canApprove &&
                    report.status === "submitted" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onApprove(report)}
                      >
                        <IconCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
