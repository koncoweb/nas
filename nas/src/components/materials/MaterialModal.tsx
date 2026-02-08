"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MaterialForm } from "./MaterialForm"
import { MaterialInput } from "@/lib/validations"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface Material {
  id: number
  name: string
  description: string | null
  category: string
  unit_type: string
  unit_cost: number
  supplier: string | null
  part_number: string | null
}

interface MaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material?: Material
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function MaterialModal({
  open,
  onOpenChange,
  material,
  mode,
  onSuccess,
}: MaterialModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: MaterialInput) => {
    setError(null)

    try {
      const url =
        mode === "create"
          ? "/api/materials"
          : `/api/materials/${material?.id}`

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menyimpan material")
      }

      toast({
        title: "Berhasil",
        description: mode === "create" 
          ? "Material berhasil dibuat" 
          : "Material berhasil diperbarui",
      })

      // Close modal and refresh data
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Buat Material Baru" : "Edit Material"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan material baru ke katalog."
              : "Perbarui informasi material."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <MaterialForm
          initialData={
            material
              ? {
                  ...material,
                  description: material.description || undefined,
                  supplier: material.supplier || undefined,
                  part_number: material.part_number || undefined,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={mode === "create" ? "Buat Material" : "Simpan Perubahan"}
        />
      </DialogContent>
    </Dialog>
  )
}
