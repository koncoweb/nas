"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuotationForm } from "@/components/quotations/QuotationForm"
import { Customer } from "@/types"
import { QuotationInput } from "@/lib/validations"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NewQuotationPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch customers")
      const data = await response.json()
      setCustomers(data.data)
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: QuotationInput) => {
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create quotation")
      }

      const quotation = await response.json()
      router.push(`/quotations/${quotation.id}`)
    } catch (error) {
      console.error("Failed to create quotation:", error)
      alert(error instanceof Error ? error.message : "Failed to create quotation")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/quotations">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Quotation</h1>
          <p className="text-muted-foreground">
            Create a new quotation for a customer
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No customers found. Please create a customer first.
                </p>
                <Link href="/customers">
                  <Button>Go to Customers</Button>
                </Link>
              </div>
            ) : (
              <QuotationForm
                customers={customers}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/quotations")}
                submitLabel="Create Quotation"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
