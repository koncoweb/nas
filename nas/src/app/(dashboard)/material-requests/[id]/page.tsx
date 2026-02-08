"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RequestItemsTable } from "@/components/material-requests/RequestItemsTable"
import { MaterialRequest, MaterialRequestItem, Material } from "@/types"
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconSend,
  IconEdit,
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"

interface MaterialRequestWithDetails extends MaterialRequest {
  project_title?: string
  project_number?: string
  requested_by_name?: string
  items: MaterialRequestItem[]
}

export default function MaterialRequestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [materialRequest, setMaterialRequest] =
    useState<MaterialRequestWithDetails | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchMaterialRequest()
    fetchMaterials()
  }, [params.id])

  const fetchMaterialRequest = async () => {
    try {
      const response = await fetch(`/api/material-requests/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch material request")
      const data = await response.json()
      setMaterialRequest(data)
    } catch (error) {
      console.error("Failed to fetch material request:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch materials")
      const data = await response.json()
      setMaterials(data.data)
    } catch (error) {
      console.error("Failed to fetch materials:", error)
    }
  }

  const handleAddItem = async (
    item: Omit<MaterialRequestItem, "id" | "material_request_id">
  ) => {
    try {
      const response = await fetch(
        `/api/material-requests/${params.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add item")
      }

      await fetchMaterialRequest()
    } catch (error) {
      console.error("Failed to add item:", error)
      alert(error instanceof Error ? error.message : "Failed to add item")
      throw error
    }
  }

  const handleUpdateItem = async (
    itemId: number,
    item: Partial<MaterialRequestItem>
  ) => {
    try {
      const response = await fetch(
        `/api/material-requests/${params.id}/items`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, itemId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update item")
      }

      await fetchMaterialRequest()
    } catch (error) {
      console.error("Failed to update item:", error)
      alert(error instanceof Error ? error.message : "Failed to update item")
      throw error
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    try {
      const response = await fetch(
        `/api/material-requests/${params.id}/items?itemId=${itemId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete item")
      }

      await fetchMaterialRequest()
    } catch (error) {
      console.error("Failed to delete item:", error)
      alert(error instanceof Error ? error.message : "Failed to delete item")
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!confirm("Submit this material request for review?")) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/material-requests/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit request")
      }

      await fetchMaterialRequest()
      alert("Material request submitted successfully")
    } catch (error) {
      console.error("Failed to submit request:", error)
      alert(error instanceof Error ? error.message : "Failed to submit request")
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm("Approve this material request?")) return

    setActionLoading(true)
    try {
      const response = await fetch(
        `/api/material-requests/${params.id}/approve`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to approve request")
      }

      await fetchMaterialRequest()
      alert("Material request approved successfully")
    } catch (error) {
      console.error("Failed to approve request:", error)
      alert(error instanceof Error ? error.message : "Failed to approve request")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!confirm("Reject this material request?")) return

    setActionLoading(true)
    try {
      const response = await fetch(
        `/api/material-requests/${params.id}/approve`,
        {
          method: "PUT",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reject request")
      }

      await fetchMaterialRequest()
      alert("Material request rejected")
    } catch (error) {
      console.error("Failed to reject request:", error)
      alert(error instanceof Error ? error.message : "Failed to reject request")
    } finally {
      setActionLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!materialRequest) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Material request not found</p>
        <Button className="mt-4" onClick={() => router.push("/material-requests")}>
          Back to Material Requests
        </Button>
      </div>
    )
  }

  const isDraft = materialRequest.status === "draft"
  const isUnderReview = materialRequest.status === "under_review"
  const isLeader = session?.user?.role === "leader"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{materialRequest.title}</h1>
            <p className="text-muted-foreground">
              {materialRequest.project_number} - {materialRequest.project_title}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <Button
              onClick={handleSubmit}
              disabled={actionLoading || materialRequest.items.length === 0}
            >
              <IconSend className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          )}
          {isUnderReview && isLeader && (
            <>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <IconCheck className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                variant="destructive"
              >
                <IconX className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(materialRequest.status)}>
                {materialRequest.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Urgency</p>
              <Badge className={getUrgencyColor(materialRequest.urgency)}>
                {materialRequest.urgency}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Request Type</p>
              <p className="font-medium capitalize">
                {materialRequest.request_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested By</p>
              <p className="font-medium">{materialRequest.requested_by_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(materialRequest.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(materialRequest.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Request Items</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestItemsTable
            items={materialRequest.items}
            materials={materials}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            disabled={!isDraft}
          />
        </CardContent>
      </Card>
    </div>
  )
}
