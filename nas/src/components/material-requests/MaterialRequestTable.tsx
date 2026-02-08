"use client"

import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MaterialRequest } from "@/types"

interface MaterialRequestTableProps {
  materialRequests: (MaterialRequest & {
    project_title?: string
    project_number?: string
    requested_by_name?: string
  })[]
}

export function MaterialRequestTable({ materialRequests }: MaterialRequestTableProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "submitted":
        return "bg-blue-500"
      case "under_review":
        return "bg-yellow-500"
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "bg-gray-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead className="text-right">Estimated Cost</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materialRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No material requests found
              </TableCell>
            </TableRow>
          ) : (
            materialRequests.map((request) => (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/material-requests/${request.id}`)}
              >
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>
                  {request.project_number && (
                    <div className="text-sm">
                      <div className="font-medium">{request.project_number}</div>
                      <div className="text-muted-foreground">{request.project_title}</div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {request.request_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getUrgencyColor(request.urgency)}>
                    {request.urgency}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{request.requested_by_name}</TableCell>
                <TableCell className="text-right">
                  ${request.estimated_total_cost.toFixed(2)}
                </TableCell>
                <TableCell>{formatDate(request.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
