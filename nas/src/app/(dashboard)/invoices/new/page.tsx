"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceForm } from "@/components/invoices/InvoiceForm"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Customer, Project } from "@/types"
import { InvoiceInput } from "@/lib/validations"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export default function NewInvoicePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customers
        const customersRes = await fetch("/api/customers?limit=1000")
        if (!customersRes.ok) throw new Error("Failed to fetch customers")
        const customersData = await customersRes.json()
        setCustomers(customersData.data || [])

        // Fetch projects
        const projectsRes = await fetch("/api/projects?limit=1000")
        if (!projectsRes.ok) throw new Error("Failed to fetch projects")
        const projectsData = await projectsRes.json()
        setProjects(projectsData.data || [])
      } catch (err) {
        setError("Failed to load data. Please try again.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (data: InvoiceInput) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create invoice")
      }

      const invoice = await response.json()
      router.push(`/invoices/${invoice.id}`)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/invoices"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
        <p className="text-muted-foreground">
          Create a new invoice for a project or customer
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Invoice Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            customers={customers}
            projects={projects}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/invoices")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
