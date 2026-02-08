"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportsTable } from "@/components/reports/ReportsTable"
import { LoadingState } from "@/components/shared/LoadingState"
import { Pagination } from "@/components/shared/Pagination"
import { IconPlus, IconFileReport } from "@tabler/icons-react"
import { ProjectReport } from "@/types"

interface Report extends ProjectReport {
  project_number: string
  project_title: string
  customer_name: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const limit = 25

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (statusFilter) {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) throw new Error("Failed to fetch reports")

      const data = await response.json()
      setReports(data.data)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (err) {
      setError("Failed to load reports. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [page, statusFilter])

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleView = (report: ProjectReport) => {
    router.push(`/reports/${report.id}`)
  }

  if (loading && reports.length === 0) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Reports</h1>
          <p className="text-muted-foreground">
            Manage project completion reports
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="customer_signed">Customer Signed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <IconFileReport className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter
                  ? "Try adjusting your filters"
                  : "Project reports will appear here"}
              </p>
            </div>
          ) : (
            <>
              <ReportsTable reports={reports} onView={handleView} />
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={limit}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {total > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {reports.length} of {total} reports
        </div>
      )}
    </div>
  )
}
