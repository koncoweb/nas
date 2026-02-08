"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { DataTable } from "@/components/shared/DataTable"

interface Quotation {
  id: number
  quote_number: string
  title: string
  customer_name: string
  total_cost: string | number
  status: string
  created_at: string
}

interface QuotationsTableProps {
  quotations: Quotation[]
  page: number
  totalPages: number
  total: number
  searchParams: Record<string, string>
}

export function QuotationsTable({
  quotations,
  page,
  totalPages,
  total,
  searchParams,
}: QuotationsTableProps) {
  const router = useRouter()

  const columns = [
    {
      key: "quote_number",
      label: "Quote #",
      sortable: true,
      render: (item: Quotation) => (
        <Link
          href={`/quotations/${item.id}`}
          className="font-medium text-primary hover:underline"
        >
          {item.quote_number}
        </Link>
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
      key: "total_cost",
      label: "Total Cost",
      sortable: true,
      render: (item: Quotation) => `${parseFloat(item.total_cost as string).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item: Quotation) => {
        const statusColors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-800",
          sent: "bg-blue-100 text-blue-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        }
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusColors[item.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        )
      },
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (item: Quotation) => new Date(item.created_at).toLocaleDateString(),
    },
  ]

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`/quotations?${params.toString()}`)
  }

  const handleRowClick = (item: Quotation) => {
    router.push(`/quotations/${item.id}`)
  }

  return (
    <DataTable
      data={quotations}
      columns={columns}
      pagination={{
        page,
        totalPages,
        total,
        limit: 25,
        onPageChange: handlePageChange,
      }}
      onRowClick={handleRowClick}
    />
  )
}
