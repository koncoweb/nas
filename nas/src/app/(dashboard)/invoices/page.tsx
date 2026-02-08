import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { InvoicesFilters } from "@/components/invoices/InvoicesFilters"
import { InvoicesPagination } from "@/components/invoices/InvoicesPagination"
import { IconPlus, IconFileInvoice } from "@tabler/icons-react"

interface InvoicesPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    customer_id?: string
    project_id?: string
  }>
}

async function getInvoices(
  page: number,
  search: string,
  status: string,
  customerId: string,
  projectId: string
) {
  const limit = 25
  const offset = (page - 1) * limit

  // Build WHERE clause as string
  const conditions: string[] = []
  if (search) {
    conditions.push(`(i.invoice_number ILIKE '%${search}%' OR i.notes ILIKE '%${search}%')`)
  }
  if (status) {
    conditions.push(`i.status = '${status}'`)
  }
  if (customerId) {
    conditions.push(`i.customer_id = ${parseInt(customerId)}`)
  }
  if (projectId) {
    conditions.push(`i.project_id = ${parseInt(projectId)}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const invoices = await sql`
    SELECT 
      i.*,
      c.company_name as customer_name,
      p.project_number,
      p.title as project_title
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN projects p ON i.project_id = p.id
    ${whereClause ? sql.unsafe(whereClause) : sql``}
    ORDER BY i.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const countResult = await sql`
    SELECT COUNT(*) as count 
    FROM invoices i
    ${whereClause ? sql.unsafe(whereClause) : sql``}
  `

  const count = parseInt(countResult[0]?.count || "0")

  return {
    invoices,
    total: count,
    totalPages: Math.ceil(count / limit),
  }
}

async function InvoicesContent({ searchParams }: InvoicesPageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || ""
  const customerId = params.customer_id || ""
  const projectId = params.project_id || ""

  const { invoices, total, totalPages } = await getInvoices(
    page,
    search,
    status,
    customerId,
    projectId
  )

  // Calculate stats
  const totalAmount = invoices.reduce(
    (sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0),
    0
  )
  const totalPaid = invoices.reduce(
    (sum: number, inv: any) => sum + parseFloat(inv.amount_paid || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage customer invoices and payments
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <IconFileInvoice className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPaid.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${(totalAmount - totalPaid).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <InvoicesFilters defaultSearch={search} defaultStatus={status} />
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="pt-6">
          <InvoiceTable invoices={invoices as any} />
          <InvoicesPagination
            page={page}
            totalPages={totalPages}
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvoicesPage(props: InvoicesPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InvoicesContent {...props} />
    </Suspense>
  )
}
