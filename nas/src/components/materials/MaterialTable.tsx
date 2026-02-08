"use client"

import { DataTable, Column } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { IconEdit, IconTrash } from "@tabler/icons-react"

interface Material {
  id: number
  name: string
  description: string | null
  category: string
  unit_type: string
  unit_cost: number
  supplier: string | null
  part_number: string | null
  created_at: string
  updated_at: string
}

interface MaterialTableProps {
  materials: Material[]
  loading?: boolean
  pagination?: {
    page: number
    totalPages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
  onSearch?: (query: string) => void
  onEdit?: (material: Material) => void
  onDelete?: (material: Material) => void
}

export function MaterialTable({
  materials,
  loading = false,
  pagination,
  onSearch,
  onEdit,
  onDelete,
}: MaterialTableProps) {
  const columns: Column<Material>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
    },
    {
      key: "unit_type",
      label: "Unit Type",
      sortable: true,
    },
    {
      key: "unit_cost",
      label: "Unit Cost",
      sortable: true,
      render: (material) => `$${Number(material.unit_cost).toFixed(2)}`,
    },
    {
      key: "supplier",
      label: "Supplier",
      sortable: true,
      render: (material) => material.supplier || "-",
    },
    {
      key: "part_number",
      label: "Part Number",
      sortable: false,
      render: (material) => material.part_number || "-",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (material) => (
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(material)
              }}
              title="Edit material"
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
                onDelete(material)
              }}
              title="Delete material"
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
      data={materials}
      columns={columns}
      searchable
      searchPlaceholder="Search by name, part number, or supplier..."
      onSearch={onSearch}
      pagination={pagination}
      loading={loading}
      emptyMessage="No materials found"
    />
  )
}
