"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { materialRequestSchema, MaterialRequestInput } from "@/lib/validations"
import { Project } from "@/types"
import { z } from "zod"

interface MaterialRequestFormProps {
  projects: Project[]
  initialData?: Partial<MaterialRequestInput>
  onSubmit: (data: MaterialRequestInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function MaterialRequestForm({
  projects,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Material Request",
}: MaterialRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<MaterialRequestInput> & { title: string; request_type: "purchase" | "warehouse"; urgency: "low" | "medium" | "high" }>({
    project_id: initialData?.project_id || undefined,
    request_type: initialData?.request_type || "purchase",
    title: initialData?.title || "",
    urgency: initialData?.urgency || "medium",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate form data
      const validated = materialRequestSchema.parse(formData)
      await onSubmit(validated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof MaterialRequestInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project_id">
          Project <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.project_id?.toString() || ""}
          onValueChange={(value) => handleChange("project_id", parseInt(value))}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.project_number} - {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.project_id && (
          <p className="text-sm text-red-600">{errors.project_id}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter request title"
          disabled={loading}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="request_type">
            Request Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.request_type}
            onValueChange={(value) => handleChange("request_type", value as "purchase" | "warehouse")}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
            </SelectContent>
          </Select>
          {errors.request_type && (
            <p className="text-sm text-red-600">{errors.request_type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgency">
            Urgency <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.urgency}
            onValueChange={(value) => handleChange("urgency", value as "low" | "medium" | "high")}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          {errors.urgency && (
            <p className="text-sm text-red-600">{errors.urgency}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
