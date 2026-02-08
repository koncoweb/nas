"use client"

import { DataTable, Column } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react"

interface Customer {
  id: number
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string | null
  created_at: string
  updated_at: string
}

interface CustomerTableProps {
  customers: Customer[]
  loading?: boolean
  pagination?: {
    page: number
    totalPages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
  onSearch?: (query: string) => void
  onEdit?: (customer: Customer) => void
  onDelete?: (customer: Customer) => void
  onView?: (customer: Customer) => void
}

export function CustomerTable({
  customers,
  loading = false,
  pagination,
  onSearch,
  onEdit,
  onDelete,
  onView,
}: CustomerTableProps) {
  const columns: Column<Customer>[] = [
    {
      key: "company_name",
      label: "Company Name",
      sortable: true,
    },
    {
      key: "contact_name",
      label: "Contact Name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "phone",
      label: "Phone",
      sortable: false,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (customer) => (
        <div className="flex items-center gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onView(customer)
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
                onEdit(customer)
              }}
              title="Edit customer"
            >
              <IconEdit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(customer)
              }}
              title="Delete customer"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={customers}
      columns={columns}
      searchable
      searchPlaceholder="Search by company, contact, email, or phone..."
      onSearch={onSearch}
      pagination={pagination}
      loading={loading}
      emptyMessage="No customers found"
    />
  )
}
