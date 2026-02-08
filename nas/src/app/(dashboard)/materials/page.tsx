"use client"

import { useState, useEffect } from "react"
import { MaterialTable } from "@/components/materials/MaterialTable"
import { MaterialModal } from "@/components/materials/MaterialModal"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconFilter } from "@tabler/icons-react"
import { toast } from "@/components/ui/use-toast"

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

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Common material categories
const MATERIAL_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Structural",
  "Mechanical",
  "Paint & Coatings",
  "Fasteners",
  "Tools",
  "Safety Equipment",
  "Other",
]

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>()
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")

  // Fetch materials
  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        search: searchQuery,
      })

      if (categoryFilter && categoryFilter !== "all") {
        params.append("category", categoryFilter)
      }

      const response = await fetch(`/api/materials?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch materials")
      }

      const data = await response.json()
      setMaterials(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast({
        title: "Error",
        description: "Failed to load materials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch materials when page, search, or category changes
  useEffect(() => {
    fetchMaterials()
  }, [page, searchQuery, categoryFilter])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1) // Reset to first page on new search
  }

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category)
    setPage(1) // Reset to first page on new filter
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleCreateMaterial = () => {
    setModalMode("create")
    setEditingMaterial(undefined)
    setModalOpen(true)
  }

  const handleEditMaterial = (material: Material) => {
    setModalMode("edit")
    setEditingMaterial(material)
    setModalOpen(true)
  }

  const handleDeleteMaterial = async (material: Material) => {
    if (!confirm(`Are you sure you want to delete ${material.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/materials/${material.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete material",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Material deleted successfully",
      })

      // Refresh the list
      fetchMaterials()
    } catch (error) {
      console.error("Error deleting material:", error)
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials Catalog</h1>
          <p className="text-gray-500 mt-1">Manage your materials inventory</p>
        </div>
        <Button onClick={handleCreateMaterial}>
          <IconPlus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg border">
        <IconFilter className="w-5 h-5 text-gray-500" />
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
            Filter by Category:
          </label>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category-filter" className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MATERIAL_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {categoryFilter && categoryFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter("all")}
          >
            Clear Filter
          </Button>
        )}
      </div>

      <MaterialTable
        materials={materials}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        onSearch={handleSearch}
        onEdit={handleEditMaterial}
        onDelete={handleDeleteMaterial}
      />

      <MaterialModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        material={editingMaterial}
        mode={modalMode}
        onSuccess={fetchMaterials}
      />
    </div>
  )
}
