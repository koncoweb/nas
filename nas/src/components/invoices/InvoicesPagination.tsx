"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface InvoicesPaginationProps {
  page: number
  totalPages: number
  searchParams: Record<string, string>
}

export function InvoicesPagination({
  page,
  totalPages,
  searchParams,
}: InvoicesPaginationProps) {
  const router = useRouter()

  const handlePrevious = () => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (page - 1).toString())
    router.push(`/invoices?${params.toString()}`)
  }

  const handleNext = () => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (page + 1).toString())
    router.push(`/invoices?${params.toString()}`)
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={handlePrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
