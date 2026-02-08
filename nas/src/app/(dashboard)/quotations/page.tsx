import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { QuotationsFilters } from "@/components/quotations/QuotationsFilters"
import { QuotationsTable } from "@/components/quotations/QuotationsTable"
import { IconPlus, IconFileText } from "@tabler/icons-react"

interface QuotationsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

async function getQuotations(page: number, search: string, status: string) {
  const limit = 25
  const offset = (page - 1) * limit

  // Build WHERE clause
  let whereConditions = []
  if (search) {
    whereConditions.push(
      `(q.title ILIKE '%${search}%' OR q.quote_number ILIKE '%${search}%' OR c.company_name ILIKE '%${search}%')`
    )
  }
  if (status) {
    whereConditions.push(`q.status = '${status}'`)
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

  const quotations = await sql`
    SELECT 
      q.id,
      q.quote_number,
      q.customer_id,
      q.title,
      q.total_cost,
      q.status,
      q.created_at,
      c.company_name as customer_name
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    ${whereClause ? sql.unsafe(whereClause) : sql``}
    ORDER BY q.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await sql`
    SELECT COUNT(*) as count 
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    ${whereClause ? sql.unsafe(whereClause) : sql``}
  `

  return {
    quotations,
    total: parseInt(count as string),
    totalPages: Math.ceil(parseInt(count as string) / limit),
  }
}

async function QuotationsContent({ searchParams }: QuotationsPageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const status = params.status || ""

  const { quotations, total, totalPages } = await getQuotations(page, search, status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">
            Manage customer quotations and price estimates
          </p>
        </div>
        <Link href="/quotations/new">
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotations.filter((q: any) => q.status === "draft").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotations.filter((q: any) => q.status === "sent").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotations.filter((q: any) => q.status === "approved").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <QuotationsFilters defaultSearch={search} defaultStatus={status} />
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardContent className="pt-6">
          <QuotationsTable
            quotations={quotations as any}
            page={page}
            totalPages={totalPages}
            total={total}
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function QuotationsPage(props: QuotationsPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QuotationsContent {...props} />
    </Suspense>
  )
}
