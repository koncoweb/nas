# Technology Stack

## nas/ - Next.js Implementation (Primary)

### Core Stack
- **Framework:** Next.js 16.1.6 with App Router
- **Language:** TypeScript 5
- **Runtime:** React 19.2.3
- **Database:** Neon PostgreSQL (serverless)
- **Authentication:** NextAuth.js v5 (beta.30)
- **Styling:** Tailwind CSS 4 with indigo theme
- **UI Components:** shadcn/ui (Mira template)
- **Icons:** Tabler Icons
- **Validation:** Zod 4.3.6
- **Password Hashing:** Argon2
- **PDF Generation:** @react-pdf/renderer
- **DOCX Generation:** docx library

### Key Libraries
- `@neondatabase/serverless` - Database connection with pooling
- `class-variance-authority` - Component variants
- `clsx` + `tailwind-merge` - Utility class management
- `date-fns` - Date formatting
- `lucide-react` - Additional icons

### Common Commands
```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing & Verification
node verify-foundation.js           # Quick foundation check
node test-foundation-complete.js    # Comprehensive test
node verify-checkpoint-12.js        # Feature verification
```

### Database Connection
- Uses Neon serverless driver with automatic connection pooling
- SQL template literals for parameterized queries
- Environment variable: `DATABASE_URL`

### Authentication Pattern
- NextAuth.js with credentials provider
- JWT session strategy (30-day expiry)
- Argon2 password hashing
- Role-based access control via JWT token
- Protected routes via middleware

---

## apps/web/ - React Router Implementation (Alternative)

### Core Stack
- **Framework:** React Router 7.6.0
- **Backend:** Hono (edge-first framework)
- **Language:** TypeScript 5.8.3
- **Runtime:** React 18.2.0
- **Database:** Neon PostgreSQL (serverless)
- **Authentication:** Auth.js (@auth/core)
- **Styling:** Tailwind CSS 3 with corporate blue theme
- **UI Components:** Chakra UI 2.8.2 + custom components
- **Icons:** Lucide React (line-style icons)
- **Build Tool:** Vite 6.3.3

### Key Libraries
- `react-router-hono-server` - Server integration
- `@tanstack/react-query` - Data fetching
- `@tanstack/react-table` - Table components
- `react-hook-form` - Form management
- `yup` - Validation
- `zustand` - State management
- `sonner` - Toast notifications
- `recharts` - Data visualization

### Common Commands
```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run typecheck        # Type checking

# Database
npm run migrate          # Run database migrations
npm run migrate:verify   # Verify schema

# Deployment
npm run deploy:vercel    # Deploy to production
npm run deploy:preview   # Deploy preview
```

### API Architecture
- Hono server with edge runtime support
- API routes in `src/app/api/`
- Serverless function entry: `api/index.js`
- Query builder utility for dynamic SQL

---

## Shared Patterns

### Database
- **Provider:** Neon PostgreSQL (serverless, auto-scaling)
- **Connection:** `@neondatabase/serverless` driver
- **Query Style:** SQL template literals (parameterized)
- **Schema:** 13+ tables (auth, customers, materials, quotations, projects, invoices, etc.)

### Deployment
- **Platform:** Vercel (serverless functions)
- **Build:** Custom build scripts for optimization
- **Environment:** Production/development configs
- **CDN:** Edge network for static assets

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Async/await for database operations
- Error boundaries for error handling
- Loading states and skeletons for UX

### Security
- Parameterized SQL queries (no string concatenation)
- Input validation on all endpoints
- Role-based access control
- Secure password hashing (Argon2)
- HTTPS enforced
- CORS configured
