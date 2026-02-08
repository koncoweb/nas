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
import { projectCostSchema, ProjectCostInput } from "@/lib/validations"
import { z } from "zod"

const COST_TYPES = [
  { value: "labor", label: "Labor" },
  { value: "materials", label: "Materials" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
]

interface Material {
  id: number
  name: string
  unit_type: string
  unit_cost: number
}

interface CostFormProps {
  projectId: number
  materials?: Material[]
  initialData?: Partial<ProjectCostInput>
  onSubmit: (data: ProjectCostInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function CostForm({
  projectId,
  materials = [],
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Cost",
}: CostFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    project_id: projectId,
    cost_type: initialData?.cost_type || "materials",
    description: initialData?.description || "",
    material_id: initialData?.material_id || undefined,
    quantity: initialData?.quantity || undefined,
    unit_cost: initialData?.unit_cost || undefined,
    total_cost: initialData?.total_cost || 0,
    vendor: initialData?.vendor || "",
    cost_date: initialData?.cost_date
      ? new Date(initialData.cost_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  })

  // Auto-calculate total_cost when quantity or unit_cost changes
  useEffect(() => {
    if (formData.quantity && formData.unit_cost) {
      const calculatedTotal = formData.quantity * formData.unit_cost
      setFormData((prev) => ({ ...prev, total_cost: calculatedTotal }))
    }
  }, [formData.quantity, formData.unit_cost])

  // When material is selected, auto-fill unit_cost
  const handleMaterialChange = (materialId: string) => {
    if (materialId === "none") {
      setFormData((prev) => ({
        ...prev,
        material_id: undefined,
      }))
      return
    }
    
    const material = materials.find((m) => m.id === parseInt(materialId))
    if (material) {
      setFormData((prev) => ({
        ...prev,
        material_id: material.id,
        unit_cost: material.unit_cost,
        description: prev.description || material.name,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        material_id: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Convert date string to Date object
      const dataToSubmit = {
        ...formData,
        cost_date: new Date(formData.cost_date),
      }

      // Validate form data
      const validated = projectCostSchema.parse(dataToSubmit)
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

  const handleChange = (field: string, value: any) => {
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
        <Label htmlFor="cost_type">
          Cost Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.cost_type}
          onValueChange={(value) => handleChange("cost_type", value)}
          disabled={loading}
        >
          <SelectTrigger id="cost_type">
            <SelectValue placeholder="Select cost type" />
          </SelectTrigger>
          <SelectContent>
            {COST_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cost_type && (
          <p className="text-sm text-red-600">{errors.cost_type}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter cost description"
          rows={3}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {formData.cost_type === "materials" && materials.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="material_id">Link to Material (Optional)</Label>
          <Select
            value={formData.material_id?.toString() || "none"}
            onValueChange={handleMaterialChange}
            disabled={loading}
          >
            <SelectTrigger id="material_id">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id.toString()}>
                  {material.name} - ${Number(material.unit_cost).toFixed(2)}/{material.unit_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            value={formData.quantity || ""}
            onChange={(e) =>
              handleChange("quantity", e.target.value ? parseFloat(e.target.value) : undefined)
            }
            placeholder="0.00"
            disabled={loading}
          />
          {errors.quantity && (
            <p className="text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input
            id="unit_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost || ""}
            onChange={(e) =>
              handleChange("unit_cost", e.target.value ? parseFloat(e.target.value) : undefined)
            }
            placeholder="0.00"
            disabled={loading}
          />
          {errors.unit_cost && (
            <p className="text-sm text-red-600">{errors.unit_cost}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_cost">
          Total Cost <span className="text-red-500">*</span>
        </Label>
        <Input
          id="total_cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.total_cost}
          onChange={(e) => handleChange("total_cost", parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          disabled={loading}
        />
        {errors.total_cost && (
          <p className="text-sm text-red-600">{errors.total_cost}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor</Label>
        <Input
          id="vendor"
          value={formData.vendor}
          onChange={(e) => handleChange("vendor", e.target.value)}
          placeholder="Enter vendor name (optional)"
          disabled={loading}
        />
        {errors.vendor && <p className="text-sm text-red-600">{errors.vendor}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost_date">
          Cost Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cost_date"
          type="date"
          value={formData.cost_date}
          onChange={(e) => handleChange("cost_date", e.target.value)}
          disabled={loading}
        />
        {errors.cost_date && (
          <p className="text-sm text-red-600">{errors.cost_date}</p>
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

