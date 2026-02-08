"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CustomerTable } from "@/components/customers/CustomerTable"
import { CustomerModal } from "@/components/customers/CustomerModal"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "@/components/ui/use-toast"

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

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        search: searchQuery,
      })

      const response = await fetch(`/api/customers?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }

      const data = await response.json()
      setCustomers(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch customers when page or search changes
  useEffect(() => {
    fetchCustomers()
  }, [page, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1) // Reset to first page on new search
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleCreateCustomer = () => {
    setModalMode("create")
    setEditingCustomer(undefined)
    setModalOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setModalMode("edit")
    setEditingCustomer(customer)
    setModalOpen(true)
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.company_name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete customer",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })

      // Refresh the list
      fetchCustomers()
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  const handleViewCustomer = (customer: Customer) => {
    router.push(`/customers/${customer.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database</p>
        </div>
        <Button onClick={handleCreateCustomer}>
          <IconPlus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <CustomerTable
        customers={customers}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        onSearch={handleSearch}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onView={handleViewCustomer}
      />

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editingCustomer}
        mode={modalMode}
        onSuccess={fetchCustomers}
      />
    </div>
  )
}
