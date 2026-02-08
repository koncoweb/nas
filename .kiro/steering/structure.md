# Project Structure

## Monorepo Layout

```
/
├── nas/                    # Next.js 14+ implementation (primary)
├── apps/
│   ├── web/               # React Router 7 implementation
│   └── mobile/            # React Native mobile app
└── .kiro/
    ├── specs/             # Feature specifications
    └── steering/          # AI assistant guidance
```

---

## nas/ - Next.js Implementation

### Directory Structure

```
nas/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth layout group
│   │   │   └── login/           # Login page
│   │   ├── (dashboard)/         # Dashboard layout group
│   │   │   ├── customers/       # Customer pages
│   │   │   ├── materials/       # Materials pages
│   │   │   ├── quotations/      # Quotation pages
│   │   │   ├── projects/        # Project pages
│   │   │   ├── material-requests/
│   │   │   ├── invoices/
│   │   │   └── dashboard/
│   │   └── api/                 # API routes
│   │       ├── auth/            # Auth endpoints
│   │       ├── customers/       # Customer CRUD
│   │       ├── materials/       # Materials CRUD
│   │       ├── quotations/      # Quotations + line items
│   │       ├── projects/        # Projects CRUD
│   │       ├── material-requests/
│   │       ├── invoices/
│   │       ├── costs/
│   │       ├── reports/
│   │       └── dashboard/
│   ├── components/
│   │   ├── layout/              # Header, Sidebar
│   │   ├── shared/              # Reusable components
│   │   │   ├── DataTable.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── customers/           # Customer-specific
│   │   ├── materials/           # Materials-specific
│   │   ├── quotations/          # Quotation-specific
│   │   ├── projects/
│   │   ├── invoices/
│   │   └── reports/
│   ├── lib/
│   │   ├── db.ts               # Database connection
│   │   ├── auth.ts             # NextAuth config
│   │   ├── validations.ts      # Zod schemas
│   │   ├── utils.ts            # Utility functions
│   │   ├── errors.ts           # Error handling
│   │   ├── api-client.ts       # API client utilities
│   │   └── pdf/                # PDF templates
│   ├── types/
│   │   ├── index.ts            # Shared types
│   │   └── next-auth.d.ts      # NextAuth type extensions
│   └── middleware.ts           # Auth middleware
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── vercel.json                 # Vercel config
└── package.json
```

### Key Conventions

**Route Groups:** Use `(auth)` and `(dashboard)` for layout separation without affecting URLs

**API Routes:** Follow REST conventions
- `GET /api/resource` - List
- `POST /api/resource` - Create
- `GET /api/resource/[id]` - Get one
- `PUT /api/resource/[id]` - Update
- `DELETE /api/resource/[id]` - Delete

**Component Organization:** Group by feature, not by type
- ✅ `components/customers/CustomerForm.tsx`
- ❌ `components/forms/CustomerForm.tsx`

**Database Queries:** Use SQL template literals
```typescript
const users = await sql`SELECT * FROM auth_users WHERE email = ${email}`
```

**Error Handling:** Use try-catch with proper error responses
```typescript
try {
  // operation
} catch (error) {
  return NextResponse.json({ error: 'Message' }, { status: 500 })
}
```

---

## apps/web/ - React Router Implementation

### Directory Structure

```
apps/web/
├── src/
│   ├── app/                     # React Router routes
│   │   ├── account/            # Auth pages
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── logout/
│   │   ├── api/                # Hono API routes
│   │   │   ├── auth/
│   │   │   ├── customers/
│   │   │   ├── materials/
│   │   │   ├── quotations/
│   │   │   ├── projects/
│   │   │   ├── material-requests/
│   │   │   ├── invoices/
│   │   │   ├── costs/
│   │   │   ├── reports/
│   │   │   ├── dashboard/
│   │   │   └── utils/          # Query builder, auth helpers
│   │   ├── customers/
│   │   ├── materials/
│   │   ├── quotations/
│   │   ├── projects/
│   │   ├── material-requests/
│   │   ├── invoices/
│   │   ├── costs/
│   │   ├── financial/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── layout.jsx          # Root layout
│   │   ├── page.jsx            # Home/dashboard
│   │   └── routes.ts           # Route config
│   ├── components/
│   │   ├── Customers/          # Customer components
│   │   ├── Materials/
│   │   ├── QuotationForm/
│   │   ├── QuotationDetail/
│   │   ├── MaterialRequestForm/
│   │   ├── MaterialRequestDetail/
│   │   ├── Invoices/
│   │   └── Reports/
│   ├── hooks/                  # Custom React hooks
│   │   ├── useCustomers.js
│   │   ├── useMaterials.js
│   │   ├── useQuotations.js
│   │   └── useAuth.js
│   ├── utils/                  # Utility functions
│   │   ├── quotationCalculations.js
│   │   ├── materialConstants.js
│   │   └── navigation.js
│   └── __create/               # Framework internals
├── api/
│   └── index.js                # Vercel serverless entry
├── scripts/
│   └── migrate.js              # Database migrations
├── plugins/                    # Vite plugins
├── public/                     # Static assets
├── vercel.json                 # Vercel config
├── react-router.config.ts      # React Router config
└── package.json
```

### Key Conventions

**File-based Routing:** React Router 7 uses file system routing
- `app/customers/page.jsx` → `/customers`
- `app/customers/[id]/page.jsx` → `/customers/:id`

**API Routes:** Hono handlers in `app/api/`
```typescript
app.get('/api/customers', async (c) => {
  // handler
})
```

**Component Naming:** PascalCase for components, camelCase for utilities

**Hooks Pattern:** Custom hooks for data fetching and business logic
```typescript
const { customers, loading, error } = useCustomers()
```

**State Management:** Zustand for global state, React Query for server state

---

## Shared Conventions

### File Naming
- **Components:** PascalCase (e.g., `CustomerForm.tsx`)
- **Utilities:** camelCase (e.g., `formatCurrency.ts`)
- **Types:** PascalCase (e.g., `Customer.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useCustomers.ts`)

### Code Organization
- **Colocation:** Keep related files together
- **Feature-based:** Group by domain, not technical layer
- **Shared components:** Only extract when used 3+ times
- **Types:** Define near usage, extract to `types/` when shared

### Database Patterns
- **Parameterized queries:** Always use template literals
- **Error handling:** Wrap in try-catch, log errors
- **Transactions:** Use for multi-step operations
- **Validation:** Validate input before database operations

### API Response Format
```typescript
// Success
{ data: {...}, message?: string }

// Error
{ error: string, details?: any }

// List with pagination
{ data: [...], total: number, page: number, limit: number }
```

### Environment Variables
- **Development:** `.env.local` (nas) or `.env` (web)
- **Production:** Set in Vercel dashboard
- **Required:** `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`
- **Optional:** Integration keys, feature flags
