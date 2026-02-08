"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { invoiceSchema, InvoiceInput } from "@/lib/validations"
import { Customer, Project } from "@/types"
import { z } from "zod"

interface InvoiceFormProps {
  customers: Customer[]
  projects: Project[]
  initialData?: Partial<InvoiceInput>
  onSubmit: (data: InvoiceInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function InvoiceForm({
  customers,
  projects,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Invoice",
}: InvoiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<InvoiceInput> & { due_date: Date }>({
    project_id: initialData?.project_id || undefined,
    customer_id: initialData?.customer_id || undefined,
    due_date: initialData?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: initialData?.notes || "",
  })

  // Auto-select customer when project is selected
  useEffect(() => {
    if (formData.project_id) {
      const project = projects.find((p) => p.id === formData.project_id)
      if (project) {
        setFormData((prev) => ({ ...prev, customer_id: project.customer_id }))
      }
    }
  }, [formData.project_id, projects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate form data
      const validated = invoiceSchema.parse(formData)
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

  const handleChange = (field: keyof InvoiceInput, value: any) => {
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
        <Label htmlFor="customer_id">
          Customer <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.customer_id?.toString() || ""}
          onValueChange={(value) => handleChange("customer_id", parseInt(value))}
          disabled={loading || !!formData.project_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customer_id && (
          <p className="text-sm text-red-600">{errors.customer_id}</p>
        )}
        {formData.project_id && (
          <p className="text-sm text-muted-foreground">
            Customer is automatically selected from the project
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">
          Due Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="due_date"
          type="date"
          value={
            formData.due_date instanceof Date
              ? formData.due_date.toISOString().split("T")[0]
              : formData.due_date
          }
          onChange={(e) => handleChange("due_date", new Date(e.target.value))}
          disabled={loading}
        />
        {errors.due_date && (
          <p className="text-sm text-red-600">{errors.due_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Enter any additional notes (optional)"
          rows={4}
          disabled={loading}
        />
        {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
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
