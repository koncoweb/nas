"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CustomerModal } from "@/components/customers/CustomerModal"
import { DetailPageSkeleton } from "@/components/shared/DetailPageSkeleton"
import { toast } from "@/components/ui/use-toast"
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBuilding,
  IconUser,
} from "@tabler/icons-react"

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

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch customer details
  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch customer")
      }

      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error("Error fetching customer:", error)
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  const handleEdit = () => {
    setModalOpen(true)
  }

  const handleDelete = async () => {
    if (!customer) return

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

      // Navigate back to customers list
      router.push("/customers")
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <DetailPageSkeleton />
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Customer not found</h2>
          <p className="text-gray-500 mt-2">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/customers")} className="mt-4">
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/customers")}
          >
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.company_name}
            </h1>
            <p className="text-gray-500 mt-1">Customer Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <IconEdit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <IconTrash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <IconBuilding className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Company Name</p>
              <p className="text-base font-medium text-gray-900">
                {customer.company_name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <IconUser className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Name</p>
              <p className="text-base font-medium text-gray-900">
                {customer.contact_name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <IconMail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <a
                href={`mailto:${customer.email}`}
                className="text-base font-medium text-indigo-600 hover:text-indigo-700"
              >
                {customer.email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <IconPhone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <a
                href={`tel:${customer.phone}`}
                className="text-base font-medium text-indigo-600 hover:text-indigo-700"
              >
                {customer.phone}
              </a>
            </div>
          </div>

          {customer.address && (
            <div className="flex items-start gap-3 md:col-span-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <IconMapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-base font-medium text-gray-900">
                  {customer.address}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="text-base font-medium text-gray-900">
              {new Date(customer.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-base font-medium text-gray-900">
              {new Date(customer.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={customer}
        mode="edit"
        onSuccess={fetchCustomer}
      />
    </div>
  )
}
