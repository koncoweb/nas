"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { projectReportSchema, ProjectReportInput } from "@/lib/validations"
import { z } from "zod"

interface ReportFormProps {
  project: {
    id: number
    project_number: string
    title: string
  }
  initialData?: Partial<ProjectReportInput>
  onSubmit: (data: ProjectReportInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function ReportForm({
  project,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Report",
}: ReportFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<ProjectReportInput>({
    project_id: project.id,
    completion_date: initialData?.completion_date || new Date(),
    work_summary: initialData?.work_summary || "",
    materials_used: initialData?.materials_used || "",
    customer_signature_url: initialData?.customer_signature_url || undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate form data
      const validated = projectReportSchema.parse(formData)
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

  const handleChange = (field: keyof ProjectReportInput, value: any) => {
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
        <Label>Project</Label>
        <div className="p-3 bg-muted rounded-md">
          <p className="font-medium">{project.project_number}</p>
          <p className="text-sm text-muted-foreground">{project.title}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="completion_date">
          Completion Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="completion_date"
          type="date"
          value={
            formData.completion_date instanceof Date
              ? formData.completion_date.toISOString().split("T")[0]
              : formData.completion_date
          }
          onChange={(e) => handleChange("completion_date", new Date(e.target.value))}
          disabled={loading}
        />
        {errors.completion_date && (
          <p className="text-sm text-red-600">{errors.completion_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="work_summary">
          Work Summary <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="work_summary"
          value={formData.work_summary}
          onChange={(e) => handleChange("work_summary", e.target.value)}
          placeholder="Describe the work performed, including any challenges and solutions..."
          rows={6}
          disabled={loading}
        />
        {errors.work_summary && (
          <p className="text-sm text-red-600">{errors.work_summary}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="materials_used">
          Materials Used <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="materials_used"
          value={formData.materials_used}
          onChange={(e) => handleChange("materials_used", e.target.value)}
          placeholder="List all materials used in the project..."
          rows={6}
          disabled={loading}
        />
        {errors.materials_used && (
          <p className="text-sm text-red-600">{errors.materials_used}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer_signature_url">Customer Signature URL</Label>
        <Input
          id="customer_signature_url"
          type="url"
          value={formData.customer_signature_url || ""}
          onChange={(e) => handleChange("customer_signature_url", e.target.value || undefined)}
          placeholder="https://example.com/signature.png (optional)"
          disabled={loading}
        />
        {errors.customer_signature_url && (
          <p className="text-sm text-red-600">{errors.customer_signature_url}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Upload the customer signature to a file storage service and paste the URL here
        </p>
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
