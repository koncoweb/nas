"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomerForm } from "./CustomerForm"
import { CustomerInput } from "@/lib/validations"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface Customer {
  id: number
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string | null
}

interface CustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function CustomerModal({
  open,
  onOpenChange,
  customer,
  mode,
  onSuccess,
}: CustomerModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CustomerInput) => {
    setError(null)

    try {
      const url =
        mode === "create"
          ? "/api/customers"
          : `/api/customers/${customer?.id}`

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menyimpan pelanggan")
      }

      // Show success toast
      toast({
        title: "Berhasil",
        description: mode === "create" 
          ? "Pelanggan berhasil dibuat" 
          : "Pelanggan berhasil diperbarui",
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
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Buat Pelanggan Baru" : "Edit Pelanggan"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan pelanggan baru ke sistem."
              : "Perbarui informasi pelanggan."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <CustomerForm
          initialData={customer ? {
            ...customer,
            address: customer.address || undefined
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={mode === "create" ? "Buat Pelanggan" : "Simpan Perubahan"}
        />
      </DialogContent>
    </Dialog>
  )
}
