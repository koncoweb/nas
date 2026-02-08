"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MaterialRequestForm } from "@/components/material-requests/MaterialRequestForm"
import { MaterialRequestInput } from "@/lib/validations"
import { Project } from "@/types"
import { IconArrowLeft } from "@tabler/icons-react"

export default function NewMaterialRequestPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects?status=planning&status=in_progress")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data.data)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: MaterialRequestInput) => {
    try {
      const response = await fetch("/api/material-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create material request")
      }

      const materialRequest = await response.json()
      router.push(`/material-requests/${materialRequest.id}`)
    } catch (error) {
      console.error("Failed to create material request:", error)
      alert(error instanceof Error ? error.message : "Failed to create material request")
    }
  }

  const handleCancel = () => {
    router.back()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Material Request</h1>
          <p className="text-muted-foreground">
            Create a new material request for a project
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No active projects found. Please create a project first.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/projects")}
              >
                Go to Projects
              </Button>
            </div>
          ) : (
            <MaterialRequestForm
              projects={projects}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
