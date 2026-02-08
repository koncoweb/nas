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
import { quotationSchema, QuotationInput } from "@/lib/validations"
import { Customer } from "@/types"
import { z } from "zod"

interface QuotationFormProps {
  customers: Customer[]
  initialData?: Partial<QuotationInput>
  onSubmit: (data: QuotationInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function QuotationForm({
  customers,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Quotation",
}: QuotationFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<QuotationInput> & { 
    title: string
    labor_hours: number
    labor_rate: number
    profit_margin: number
  }>({
    customer_id: initialData?.customer_id || undefined,
    title: initialData?.title || "",
    description: initialData?.description || "",
    labor_hours: initialData?.labor_hours || 0,
    labor_rate: initialData?.labor_rate || 0,
    profit_margin: initialData?.profit_margin || 0.15,
  })

  // Calculate totals in real-time
  const [calculatedTotals, setCalculatedTotals] = useState({
    laborCost: 0,
    materialsCost: 0,
    subtotal: 0,
    totalCost: 0,
  })

  useEffect(() => {
    const laborCost = formData.labor_hours * formData.labor_rate
    const materialsCost = 0 // Will be updated when line items are added
    const subtotal = laborCost + materialsCost
    const totalCost = subtotal + subtotal * formData.profit_margin

    setCalculatedTotals({
      laborCost,
      materialsCost,
      subtotal,
      totalCost,
    })
  }, [formData.labor_hours, formData.labor_rate, formData.profit_margin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate form data
      const validated = quotationSchema.parse(formData)
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

  const handleChange = (field: keyof QuotationInput, value: any) => {
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
        <Label htmlFor="customer_id">
          Customer <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.customer_id?.toString() || ""}
          onValueChange={(value) => handleChange("customer_id", parseInt(value))}
          disabled={loading}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter quotation title"
          disabled={loading}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter quotation description (optional)"
          rows={4}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="labor_hours">
            Labor Hours <span className="text-red-500">*</span>
          </Label>
          <Input
            id="labor_hours"
            type="number"
            step="0.5"
            min="0"
            value={formData.labor_hours}
            onChange={(e) =>
              handleChange("labor_hours", parseFloat(e.target.value) || 0)
            }
            placeholder="0"
            disabled={loading}
          />
          {errors.labor_hours && (
            <p className="text-sm text-red-600">{errors.labor_hours}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="labor_rate">
            Labor Rate ($/hr) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="labor_rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.labor_rate}
            onChange={(e) =>
              handleChange("labor_rate", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            disabled={loading}
          />
          {errors.labor_rate && (
            <p className="text-sm text-red-600">{errors.labor_rate}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profit_margin">
          Profit Margin (%) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="profit_margin"
          type="number"
          step="1"
          min="0"
          max="100"
          value={(formData.profit_margin * 100).toFixed(0)}
          onChange={(e) =>
            handleChange("profit_margin", parseFloat(e.target.value) / 100 || 0)
          }
          placeholder="15"
          disabled={loading}
        />
        {errors.profit_margin && (
          <p className="text-sm text-red-600">{errors.profit_margin}</p>
        )}
      </div>

      {/* Calculated Totals Display */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h3 className="font-semibold text-sm">Estimated Costs</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Labor Cost:</span>
            <span className="font-medium">
              ${calculatedTotals.laborCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materials Cost:</span>
            <span className="font-medium">
              ${calculatedTotals.materialsCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">
              ${calculatedTotals.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Profit ({(formData.profit_margin * 100).toFixed(0)}%):
            </span>
            <span className="font-medium">
              ${(calculatedTotals.subtotal * formData.profit_margin).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Total Cost:</span>
            <span className="font-bold text-lg">
              ${calculatedTotals.totalCost.toFixed(2)}
            </span>
          </div>
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
