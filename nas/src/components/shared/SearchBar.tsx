"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { IconSearch, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
  className?: string
  defaultValue?: string
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  className,
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const onSearchRef = useRef(onSearch)

  // Update ref when onSearch changes
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const handleClear = () => {
    setQuery("")
  }

  return (
    <div className={cn("relative", className)}>
      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-9"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <IconX className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
