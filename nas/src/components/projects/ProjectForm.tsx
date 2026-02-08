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

interface Customer {
  id: number
  company_name: string
}

interface Engineer {
  id: string
  name: string
  email: string
}

interface ProjectFormData {
  customer_id: number | undefined
  title: string
  description: string
  assigned_engineer: string
  start_date: string
  expected_completion: string
}

interface ProjectFormProps {
  customers: Customer[]
  engineers: Engineer[]
  initialData?: Partial<ProjectFormData>
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  loading?: boolean
}

export function ProjectForm({
  customers,
  engineers,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Project",
  loading = false,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    customer_id: initialData?.customer_id || undefined,
    title: initialData?.title || "",
    description: initialData?.description || "",
    assigned_engineer: initialData?.assigned_engineer || "",
    start_date: initialData?.start_date || "",
    expected_completion: initialData?.expected_completion || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_id) {
      newErrors.customer_id = "Pelanggan wajib dipilih"
    }
    if (!formData.title.trim()) {
      newErrors.title = "Judul wajib diisi"
    }
    if (formData.start_date && formData.expected_completion) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.expected_completion)
      if (start > end) {
        newErrors.expected_completion = "Tanggal penyelesaian harus setelah tanggal mulai"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  const handleChange = (field: keyof ProjectFormData, value: any) => {
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
          Pelanggan <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.customer_id?.toString() || ""}
          onValueChange={(value) => handleChange("customer_id", parseInt(value))}
        >
          <SelectTrigger id="customer_id" className={errors.customer_id ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih pelanggan" />
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
          <p className="text-sm text-red-500">{errors.customer_id}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Judul Proyek <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Masukkan judul proyek"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Masukkan deskripsi proyek"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assigned_engineer">Engineer yang Ditugaskan</Label>
        <Select
          value={formData.assigned_engineer || "none"}
          onValueChange={(value) => handleChange("assigned_engineer", value === "none" ? "" : value)}
        >
          <SelectTrigger id="assigned_engineer">
            <SelectValue placeholder="Pilih engineer (opsional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tidak Ada</SelectItem>
            {engineers.map((engineer) => (
              <SelectItem key={engineer.id} value={engineer.id}>
                {engineer.name} ({engineer.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Tanggal Mulai</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange("start_date", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected_completion">Tanggal Penyelesaian</Label>
          <Input
            id="expected_completion"
            type="date"
            value={formData.expected_completion}
            onChange={(e) => handleChange("expected_completion", e.target.value)}
            className={errors.expected_completion ? "border-red-500" : ""}
          />
          {errors.expected_completion && (
            <p className="text-sm text-red-500">{errors.expected_completion}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
        )}
      </div>
    </form>
  )
}
