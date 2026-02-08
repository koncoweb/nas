# Design Document: NAS Rebuild

## Overview

The NAS Marine Engineering Project Management System will be rebuilt as a modern, deployment-friendly web application using Next.js 14+ with the App Router architecture. The system will connect to an existing Neon PostgreSQL database and provide a comprehensive interface for managing the complete lifecycle of marine engineering projects.

### Key Design Decisions

1. **Framework Choice**: Next.js 14+ App Router
   - Server-side rendering for optimal performance
   - API routes co-located with application code
   - Built-in optimization for Vercel deployment
   - Simpler deployment than React Router 7 + Hono

2. **UI Framework**: shadcn/ui with custom Mira template
   - Modern, accessible components built on Radix UI
   - Customizable with Tailwind CSS
   - Tabler icons for consistent iconography
   - Indigo theme with gray base colors

3. **Authentication**: NextAuth.js v5 (Auth.js)
   - Industry-standard authentication solution
   - Built-in session management
   - Credentials provider for username/password auth
   - Compatible with existing database schema

4. **Database Access**: Neon Serverless Driver
   - Direct PostgreSQL connection with connection pooling
   - Optimized for serverless environments
   - No ORM overhead for better performance

5. **State Management**: React Server Components + Client Components
   - Server components for data fetching
   - Client components for interactivity
   - Minimal client-side state management

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Client Components (shadcn/ui)                   │ │
│  │  - Forms, Modals, Interactive Tables                   │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│              Next.js Application (Vercel)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  App Router Pages (Server Components)                  │ │
│  │  - Dashboard, Customers, Materials, Quotations, etc.   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (/app/api/*)                               │ │
│  │  - RESTful endpoints for CRUD operations               │ │
│  │  - Authentication endpoints                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NextAuth.js                                            │ │
│  │  - Session management                                   │ │
│  │  - Credentials provider                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │ PostgreSQL Protocol
┌───────────────────────▼─────────────────────────────────────┐
│              Neon PostgreSQL Database                        │
│  - 17 existing tables                                        │
│  - Connection pooling enabled                                │
│  - Hosted in us-east-1                                       │
└──────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
nas/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── materials/
│   │   │   │   └── page.tsx
│   │   │   ├── quotations/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── material-requests/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── customers/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── materials/
│   │   │   │   └── route.ts
│   │   │   ├── quotations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── line-items/
│   │   │   │       │   └── route.ts
│   │   │   │       └── convert-to-project/
│   │   │   │           └── route.ts
│   │   │   ├── projects/
│   │   │   │   └── route.ts
│   │   │   ├── material-requests/
│   │   │   │   └── route.ts
│   │   │   ├── costs/
│   │   │   │   └── route.ts
│   │   │   └── invoices/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Navigation.tsx
│   │   ├── customers/
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerModal.tsx
│   │   ├── materials/
│   │   │   ├── MaterialTable.tsx
│   │   │   └── MaterialForm.tsx
│   │   ├── quotations/
│   │   │   ├── QuotationForm.tsx
│   │   │   ├── LineItemsTable.tsx
│   │   │   └── ScopeOfWorkForm.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── ProjectTimeline.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── SearchBar.tsx
│   │       ├── Pagination.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── db.ts            # Database connection
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── utils.ts         # Utility functions
│   │   └── validations.ts   # Zod schemas
│   └── types/
│       └── index.ts         # TypeScript types
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Components and Interfaces

### Authentication System

**NextAuth Configuration** (`src/lib/auth.ts`):
```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { neon } from "@neondatabase/serverless"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const sql = neon(process.env.DATABASE_URL!)
        
        // Query auth_users table
        const users = await sql`
          SELECT id, name, email, user_role 
          FROM auth_users 
          WHERE email = ${credentials.email}
        `
        
        if (users.length === 0) return null
        
        // Verify password (assuming bcrypt hashed)
        const user = users[0]
        const isValid = await verifyPassword(credentials.password, user.password_hash)
        
        if (!isValid) return null
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.user_role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}
```

### Database Connection

**Database Client** (`src/lib/db.ts`):
```typescript
import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

// Helper function for transactions
export async function withTransaction<T>(
  callback: (sql: typeof sql) => Promise<T>
): Promise<T> {
  // Neon serverless driver handles connection pooling automatically
  return callback(sql)
}
```

### API Route Pattern

**Standard CRUD API Route** (`src/app/api/customers/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { z } from "zod"

const customerSchema = z.object({
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional()
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "25")
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit
  
  try {
    const customers = await sql`
      SELECT * FROM customers
      WHERE company_name ILIKE ${`%${search}%`}
         OR contact_name ILIKE ${`%${search}%`}
         OR email ILIKE ${`%${search}%`}
      ORDER BY company_name
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM customers
      WHERE company_name ILIKE ${`%${search}%`}
         OR contact_name ILIKE ${`%${search}%`}
         OR email ILIKE ${`%${search}%`}
    `
    
    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const validated = customerSchema.parse(body)
    
    const [customer] = await sql`
      INSERT INTO customers (company_name, contact_name, email, phone, address)
      VALUES (${validated.company_name}, ${validated.contact_name}, 
              ${validated.email}, ${validated.phone}, ${validated.address || null})
      RETURNING *
    `
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    )
  }
}
```

### Reusable Data Table Component

**Generic Data Table** (`src/components/shared/DataTable.tsx`):
```typescript
"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react"

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  onSearch?: (query: string) => void
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (item: T) => void
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchable = false,
  onSearch,
  pagination,
  onRowClick
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }
  
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }
  
  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center gap-2">
          <IconSearch className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={column.sortable ? "cursor-pointer" : ""}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                className={onRowClick ? "cursor-pointer" : ""}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <IconChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <IconChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Quotation Management

**Quotation Form Component** (`src/components/quotations/QuotationForm.tsx`):
```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface QuotationFormProps {
  customers: Array<{ id: number; company_name: string }>
  initialData?: Partial<Quotation>
}

export function QuotationForm({ customers, initialData }: QuotationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    labor_hours: initialData?.labor_hours || 0,
    labor_rate: initialData?.labor_rate || 0,
    profit_margin: initialData?.profit_margin || 0.15
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error("Failed to create quotation")
      
      const quotation = await response.json()
      toast({ title: "Quotation created successfully" })
      router.push(`/quotations/${quotation.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customer">Customer</Label>
        <Select
          value={formData.customer_id}
          onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={String(customer.id)}>
                {customer.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="labor_hours">Labor Hours</Label>
          <Input
            id="labor_hours"
            type="number"
            step="0.5"
            value={formData.labor_hours}
            onChange={(e) => setFormData({ ...formData, labor_hours: parseFloat(e.target.value) })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="labor_rate">Labor Rate ($/hr)</Label>
          <Input
            id="labor_rate"
            type="number"
            step="0.01"
            value={formData.labor_rate}
            onChange={(e) => setFormData({ ...formData, labor_rate: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="profit_margin">Profit Margin (%)</Label>
        <Input
          id="profit_margin"
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={formData.profit_margin * 100}
          onChange={(e) => setFormData({ ...formData, profit_margin: parseFloat(e.target.value) / 100 })}
          required
        />
      </div>
      
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Quotation"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

## Data Models

### TypeScript Interfaces

All data models correspond directly to the existing database schema:

```typescript
// User and Authentication
interface User {
  id: string
  name: string
  email: string
  emailVerified: Date | null
  image: string | null
  user_role: "leader" | "sales" | "accounting" | "engineer"
}

// Customer
interface Customer {
  id: number
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string | null
  created_at: Date
  updated_at: Date
}

// Material
interface Material {
  id: number
  name: string
  description: string | null
  category: string
  unit_type: string
  unit_cost: number
  supplier: string | null
  part_number: string | null
  created_at: Date
  updated_at: Date
}

// Quotation
interface Quotation {
  id: number
  quote_number: string
  customer_id: number
  title: string
  description: string | null
  labor_hours: number
  labor_rate: number
  materials_cost: number
  labor_cost: number
  total_cost: number
  profit_margin: number
  status: "draft" | "sent" | "approved" | "rejected"
  created_by: string
  created_at: Date
  updated_at: Date
}

interface QuotationLineItem {
  id: number
  quotation_id: number
  material_id: number | null
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

interface QuotationScopeWork {
  id: number
  quotation_id: number
  step_number: number
  description: string
  work_category: string | null
}

// Project
interface Project {
  id: number
  project_number: string
  quotation_id: number | null
  customer_id: number
  title: string
  description: string | null
  status: "planning" | "in_progress" | "completed"
  assigned_engineer: string | null
  start_date: Date | null
  expected_completion: Date | null
  actual_completion: Date | null
  created_at: Date
  updated_at: Date
}

// Material Request
interface MaterialRequest {
  id: number
  project_id: number
  requested_by: string
  request_type: "purchase" | "warehouse"
  title: string
  urgency: "low" | "medium" | "high"
  estimated_total_cost: number
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected"
  created_at: Date
  updated_at: Date
}

interface MaterialRequestItem {
  id: number
  material_request_id: number
  material_id: number | null
  description: string
  quantity: number
  estimated_unit_cost: number
}

// Project Cost
interface ProjectCost {
  id: number
  project_id: number
  cost_type: "labor" | "materials" | "equipment" | "other"
  description: string
  material_id: number | null
  quantity: number | null
  unit_cost: number | null
  total_cost: number
  vendor: string | null
  cost_date: Date
  created_at: Date
}

// Invoice
interface Invoice {
  id: number
  invoice_number: string
  project_id: number
  customer_id: number
  issue_date: Date
  due_date: Date
  total_amount: number
  amount_paid: number
  status: "draft" | "sent" | "partial" | "paid"
  notes: string | null
  created_at: Date
  updated_at: Date
}

interface InvoiceLineItem {
  id: number
  invoice_id: number
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

// Project Report
interface ProjectReport {
  id: number
  project_id: number
  completion_date: Date
  work_summary: string
  materials_used: string
  customer_signature_url: string | null
  status: "draft" | "submitted" | "approved"
  created_at: Date
  updated_at: Date
}
```

### Validation Schemas

Using Zod for runtime validation:

```typescript
import { z } from "zod"

export const customerSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  contact_name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional()
})

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit_type: z.string().min(1, "Unit type is required"),
  unit_cost: z.number().positive("Unit cost must be positive"),
  supplier: z.string().optional(),
  part_number: z.string().optional()
})

export const quotationSchema = z.object({
  customer_id: z.number().positive(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  labor_hours: z.number().nonnegative("Labor hours cannot be negative"),
  labor_rate: z.number().positive("Labor rate must be positive"),
  profit_margin: z.number().min(0).max(1, "Profit margin must be between 0 and 1")
})

export const projectSchema = z.object({
  customer_id: z.number().positive(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigned_engineer: z.string().optional(),
  start_date: z.date().optional(),
  expected_completion: z.date().optional()
}).refine(
  (data) => {
    if (data.start_date && data.expected_completion) {
      return data.start_date <= data.expected_completion
    }
    return true
  },
  {
    message: "Expected completion must be after start date",
    path: ["expected_completion"]
  }
)

export const materialRequestSchema = z.object({
  project_id: z.number().positive(),
  request_type: z.enum(["purchase", "warehouse"]),
  title: z.string().min(1, "Title is required"),
  urgency: z.enum(["low", "medium", "high"])
})

export const invoiceSchema = z.object({
  project_id: z.number().positive(),
  customer_id: z.number().positive(),
  issue_date: z.date(),
  due_date: z.date(),
  notes: z.string().optional()
}).refine(
  (data) => data.issue_date <= data.due_date,
  {
    message: "Due date must be after issue date",
    path: ["due_date"]
  }
)
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties. I've eliminated redundancy by combining related properties and ensuring each property provides unique validation value:

- Database error handling (2.4) and general error handling (14.2) can be combined into one comprehensive error handling property
- Form validation (4.5) and required field validation (14.1) are redundant - combined into one property
- Search functionality across customers (5.2) and materials (6.2) follow the same pattern - can be generalized
- Cost calculation properties (7.4, 9.3, 10.5, 11.4, 13.2) all test arithmetic correctness - can be grouped
- Status workflow properties (7.5, 8.4, 9.4, 11.5, 12.5) all test state machine validity - can be generalized
- Unique identifier generation (8.2, 11.2) follows the same pattern - can be combined

### Core Properties

**Property 1: Database Error Handling**

*For any* database operation that fails due to connection issues or query errors, the system should catch the error, log technical details, and return a user-friendly error message to the client.

**Validates: Requirements 2.4, 14.2**

**Property 2: Form Validation**

*For any* form submission with missing required fields or invalid data (invalid email, phone, or numeric values), the system should reject the submission and display field-specific validation error messages.

**Validates: Requirements 4.5, 14.1, 14.4**

**Property 3: Loading State Display**

*For any* asynchronous operation (API calls, data fetching), the system should display a loading indicator while the operation is in progress and hide it when complete.

**Validates: Requirements 4.6, 15.6**

**Property 4: Toast Notifications**

*For any* successful or failed operation (create, update, delete), the system should display an appropriate toast notification with a success or error message.

**Validates: Requirements 4.7**

**Property 5: Search Functionality**

*For any* search query on a searchable entity (customers, materials, quotations, projects), all returned results should match the search query in at least one of the specified searchable fields.

**Validates: Requirements 5.2, 6.2**

**Property 6: Category Filtering**

*For any* category filter applied to materials, all returned results should have exactly that category value.

**Validates: Requirements 6.3**

**Property 7: Cost Calculation Accuracy**

*For any* entity with calculated totals (quotations, material requests, invoices, project costs), the calculated total should equal the sum of its component costs with proper arithmetic precision.

Specifically:
- Quotation: `total_cost = (labor_hours × labor_rate) + materials_cost + (profit_margin × subtotal)`
- Material Request: `estimated_total_cost = Σ(quantity × estimated_unit_cost)` for all items
- Invoice: `total_amount = Σ(quantity × unit_price)` for all line items
- Project Costs: displayed totals should equal `Σ(total_cost)` grouped by cost_type

**Validates: Requirements 7.4, 9.3, 10.5, 11.4, 13.2**

**Property 8: Status Workflow Validity**

*For any* entity with a status workflow (quotations, projects, material requests, invoices, project reports), status transitions should only occur along valid paths defined in the workflow, and invalid transitions should be rejected.

Valid workflows:
- Quotation: draft → sent → (approved | rejected)
- Project: planning → in_progress → completed
- Material Request: draft → submitted → under_review → (approved | rejected)
- Invoice: draft → sent → partial → paid
- Project Report: draft → submitted → approved

**Validates: Requirements 7.5, 8.4, 9.4, 11.5, 12.5**

**Property 9: Unique Identifier Generation**

*For any* two distinct entities of the same type that require unique identifiers (project_number, invoice_number, quote_number), their generated identifiers should be different.

**Validates: Requirements 8.2, 11.2**

**Property 10: Authorization Enforcement**

*For any* protected route or API endpoint, when accessed by a user without the required role, the system should deny access and return an appropriate error message.

**Validates: Requirements 3.7, 14.3**

**Property 11: Referential Integrity on Delete**

*For any* delete operation on an entity with foreign key relationships (customers, materials), if related records exist in dependent tables, the system should prevent deletion and return an error explaining the constraint.

**Validates: Requirements 5.5, 6.6, 14.5**

**Property 12: Date Range Validation**

*For any* entity with date range fields (projects with start_date and expected_completion, invoices with issue_date and due_date), the start/issue date should be less than or equal to the end/due date, and invalid ranges should be rejected.

**Validates: Requirements 14.6**

**Property 13: Table Sorting**

*For any* data table with sortable columns, when a user clicks a column header, the table data should be reordered according to that column's values in ascending or descending order.

**Validates: Requirements 15.1**

**Property 14: Pagination with Filters**

*For any* paginated list with applied filters, the pagination controls should reflect the filtered dataset count, and navigating between pages should preserve both the filter criteria and sort order.

**Validates: Requirements 15.5, 15.7**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials: Return 401 with "Invalid email or password"
   - Expired session: Redirect to login page
   - Missing session: Return 401 with "Authentication required"

2. **Authorization Errors**
   - Insufficient permissions: Return 403 with "You don't have permission to perform this action"
   - Role-based restrictions: Return 403 with specific message about required role

3. **Validation Errors**
   - Missing required fields: Return 400 with field-specific errors
   - Invalid format (email, phone): Return 400 with format requirements
   - Invalid date ranges: Return 400 with constraint explanation
   - Referential integrity violations: Return 400 with dependency explanation

4. **Database Errors**
   - Connection failures: Return 500 with "Database connection failed. Please try again."
   - Query errors: Log full error, return 500 with "An error occurred. Please contact support."
   - Constraint violations: Return 400 with user-friendly constraint explanation

5. **Not Found Errors**
   - Resource not found: Return 404 with "Resource not found"
   - Invalid ID: Return 404 with specific entity type

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: string              // User-friendly message
  details?: string[]         // Additional details (e.g., validation errors)
  code?: string             // Error code for client handling
  timestamp: string         // ISO timestamp
}
```

Example:
```json
{
  "error": "Validation failed",
  "details": [
    "company_name: Company name is required",
    "email: Invalid email address"
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Logging

- All errors are logged with appropriate severity levels
- Database errors include full stack traces in logs
- User-facing errors exclude sensitive information
- Error logs include request context (user ID, endpoint, timestamp)

### Client-Side Error Handling

```typescript
async function handleApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall()
    
    if (!response.ok) {
      const error = await response.json()
      
      // Show toast notification
      toast({
        title: "Error",
        description: error.error,
        variant: "destructive"
      })
      
      // Handle specific error codes
      if (response.status === 401) {
        // Redirect to login
        window.location.href = "/login"
      }
      
      throw new Error(error.error)
    }
    
    return response.json()
  } catch (error) {
    // Network errors
    toast({
      title: "Network Error",
      description: "Unable to connect to server. Please check your connection.",
      variant: "destructive"
    })
    throw error
  }
}
```

## Testing Strategy

### Dual Testing Approach

The system will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across randomized inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: nas-rebuild, Property {N}: {property description}`

**Example Property Test**:

```typescript
import fc from "fast-check"
import { describe, it, expect } from "vitest"

describe("Feature: nas-rebuild, Property 7: Cost Calculation Accuracy", () => {
  it("should calculate quotation total correctly for any valid inputs", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000 }), // labor_hours
        fc.float({ min: 0, max: 500 }),  // labor_rate
        fc.float({ min: 0, max: 10000 }), // materials_cost
        fc.float({ min: 0, max: 0.5 }),  // profit_margin
        (laborHours, laborRate, materialsCost, profitMargin) => {
          const laborCost = laborHours * laborRate
          const subtotal = laborCost + materialsCost
          const expectedTotal = subtotal + (subtotal * profitMargin)
          
          const result = calculateQuotationTotal({
            labor_hours: laborHours,
            labor_rate: laborRate,
            materials_cost: materialsCost,
            profit_margin: profitMargin
          })
          
          // Allow for floating point precision
          expect(Math.abs(result - expectedTotal)).toBeLessThan(0.01)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing

**Library**: Vitest

**Focus Areas**:
- API endpoint integration tests
- Authentication flow tests
- Database query tests (with test database)
- Component rendering tests (React Testing Library)
- Form submission tests
- Edge cases (empty lists, null values, boundary conditions)

**Example Unit Test**:

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { POST } from "@/app/api/customers/route"

describe("Customer API", () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase()
  })
  
  it("should create a customer with valid data", async () => {
    const request = new Request("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({
        company_name: "Test Company",
        contact_name: "John Doe",
        email: "john@test.com",
        phone: "555-0100"
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.company_name).toBe("Test Company")
    expect(data.id).toBeDefined()
  })
  
  it("should reject customer creation with missing required fields", async () => {
    const request = new Request("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({
        company_name: "Test Company"
        // Missing required fields
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe("Validation failed")
    expect(data.details).toContain("contact_name: Contact name is required")
  })
})
```

### Test Coverage Goals

- **API Routes**: 90%+ coverage
- **Business Logic**: 95%+ coverage
- **Components**: 80%+ coverage (focus on logic, not styling)
- **Utilities**: 100% coverage

### Integration Testing

- Test complete user flows (create quotation → convert to project → create invoice)
- Test authentication and authorization across all protected routes
- Test database transactions and rollbacks
- Test file uploads and PDF generation

### Testing Database

Use a separate test database or in-memory SQLite for tests:

```typescript
// test-setup.ts
import { neon } from "@neondatabase/serverless"

export async function setupTestDatabase() {
  const sql = neon(process.env.TEST_DATABASE_URL!)
  
  // Clear all tables
  await sql`TRUNCATE customers, materials, quotations, projects CASCADE`
  
  // Seed test data
  await sql`
    INSERT INTO auth_users (id, name, email, user_role)
    VALUES ('test-user-1', 'Test User', 'test@example.com', 'leader')
  `
}
```

### Continuous Integration

- Run all tests on every commit
- Fail build if any test fails
- Generate coverage reports
- Run property tests with increased iterations (1000+) on main branch

### Manual Testing Checklist

Before deployment:
- [ ] Test login/logout flow
- [ ] Test all CRUD operations for each entity
- [ ] Test responsive design on mobile, tablet, desktop
- [ ] Test PDF generation for quotations and invoices
- [ ] Test file uploads
- [ ] Test role-based access control
- [ ] Test error handling (disconnect database, invalid inputs)
- [ ] Test pagination and sorting on all list pages
- [ ] Test search and filter functionality
- [ ] Verify deployment to Vercel succeeds

