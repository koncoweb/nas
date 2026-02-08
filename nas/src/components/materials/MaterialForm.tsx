"use client"

import { useState } from "react"
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
import { materialSchema, MaterialInput } from "@/lib/validations"
import { z } from "zod"

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

// Common unit types
const UNIT_TYPES = [
  "piece",
  "meter",
  "foot",
  "kilogram",
  "pound",
  "liter",
  "gallon",
  "box",
  "roll",
  "sheet",
]

interface MaterialFormProps {
  initialData?: Partial<MaterialInput>
  onSubmit: (data: MaterialInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function MaterialForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Material",
}: MaterialFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<MaterialInput> & { name: string }>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || undefined,
    unit_type: initialData?.unit_type || undefined,
    unit_cost: initialData?.unit_cost ? Number(initialData.unit_cost) : 0,
    supplier: initialData?.supplier || "",
    part_number: initialData?.part_number || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate form data
      const validated = materialSchema.parse(formData)
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

  const handleChange = (field: keyof MaterialInput, value: string | number | undefined) => {
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
        <Label htmlFor="name">
          Material Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Enter material name"
          disabled={loading}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description (optional)"
          rows={3}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category || ""}
            onValueChange={(value) => handleChange("category", value)}
            disabled={loading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_type">
            Unit Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.unit_type || ""}
            onValueChange={(value) => handleChange("unit_type", value)}
            disabled={loading}
          >
            <SelectTrigger id="unit_type">
              <SelectValue placeholder="Select unit type" />
            </SelectTrigger>
            <SelectContent>
              {UNIT_TYPES.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit_type && (
            <p className="text-sm text-red-600">{errors.unit_type}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit_cost">
          Unit Cost <span className="text-red-500">*</span>
        </Label>
        <Input
          id="unit_cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.unit_cost}
          onChange={(e) => {
            const value = e.target.value
            handleChange("unit_cost", value === "" ? 0 : parseFloat(value))
          }}
          placeholder="0.00"
          disabled={loading}
        />
        {errors.unit_cost && (
          <p className="text-sm text-red-600">{errors.unit_cost}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier</Label>
        <Input
          id="supplier"
          value={formData.supplier}
          onChange={(e) => handleChange("supplier", e.target.value)}
          placeholder="Enter supplier name (optional)"
          disabled={loading}
        />
        {errors.supplier && (
          <p className="text-sm text-red-600">{errors.supplier}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="part_number">Part Number</Label>
        <Input
          id="part_number"
          value={formData.part_number}
          onChange={(e) => handleChange("part_number", e.target.value)}
          placeholder="Enter part number (optional)"
          disabled={loading}
        />
        {errors.part_number && (
          <p className="text-sm text-red-600">{errors.part_number}</p>
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
