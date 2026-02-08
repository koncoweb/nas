"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SearchBar } from "@/components/shared/SearchBar"

interface QuotationsFiltersProps {
  defaultSearch?: string
  defaultStatus?: string
}

export function QuotationsFilters({ defaultSearch = "", defaultStatus = "" }: QuotationsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set("search", query)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/quotations?${params.toString()}`)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set("status", e.target.value)
    } else {
      params.delete("status")
    }
    params.set("page", "1")
    router.push(`/quotations?${params.toString()}`)
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <SearchBar
          placeholder="Search quotations..."
          onSearch={handleSearch}
          defaultValue={defaultSearch}
        />
      </div>
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        defaultValue={defaultStatus}
        onChange={handleStatusChange}
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  )
}
