"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { customerSchema, CustomerInput } from "@/lib/validations"
import { z } from "zod"

interface CustomerFormProps {
  initialData?: Partial<CustomerInput>
  onSubmit: (data: CustomerInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Customer",
}: CustomerFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CustomerInput>({
    company_name: initialData?.company_name || "",
    contact_name: initialData?.contact_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate form data
      const validated = customerSchema.parse(formData)
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

  const handleChange = (
    field: keyof CustomerInput,
    value: string
  ) => {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">
          Company Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => handleChange("company_name", e.target.value)}
          placeholder="Enter company name"
          disabled={loading}
        />
        {errors.company_name && (
          <p className="text-sm text-red-600">{errors.company_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_name">
          Contact Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contact_name"
          value={formData.contact_name}
          onChange={(e) => handleChange("contact_name", e.target.value)}
          placeholder="Enter contact name"
          disabled={loading}
        />
        {errors.contact_name && (
          <p className="text-sm text-red-600">{errors.contact_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="email@example.com"
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="555-0100"
          disabled={loading}
        />
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Enter address (optional)"
          rows={3}
          disabled={loading}
        />
        {errors.address && (
          <p className="text-sm text-red-600">{errors.address}</p>
        )}
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
