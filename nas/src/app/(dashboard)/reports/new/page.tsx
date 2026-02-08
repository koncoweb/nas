"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReportForm } from "@/components/reports/ReportForm"
import { LoadingState } from "@/components/shared/LoadingState"
import { IconArrowLeft } from "@tabler/icons-react"
import { ProjectReportInput } from "@/lib/validations"

interface Project {
  id: number
  project_number: string
  title: string
  customer_name: string
}

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("project_id")
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    } else {
      setLoading(false)
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError("Failed to load project. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: ProjectReportInput) => {
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create report")
      }

      const report = await response.json()
      router.push(`/reports/${report.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a project first</p>
        <Link href="/projects">
          <Button className="mt-4">Go to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Back to Reports
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Report</h1>
        <p className="text-muted-foreground">
          Create a project completion report
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Project: </span>
              <span className="font-medium">
                {project.project_number} - {project.title}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Customer: </span>
              <span className="font-medium">{project.customer_name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportForm
            project={project}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/reports")}
            submitLabel={submitting ? "Creating..." : "Create Report"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
