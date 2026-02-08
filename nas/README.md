# NAS - Marine Engineering Project Management System

A modern web application for managing marine engineering projects, built with Next.js 14+, TypeScript, and Neon PostgreSQL.

## 🚀 Quick Start

**Get started in 5 minutes:** See [QUICK_START.md](./QUICK_START.md)

## ✅ Foundation Status

**Checkpoint 4 Completed:** All foundation components are implemented and verified.

- ✅ Next.js 14+ with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with indigo theme
- ✅ shadcn/ui components
- ✅ Database connection (Neon PostgreSQL)
- ✅ Authentication system (NextAuth.js)
- ✅ Core UI components
- ✅ Form validation utilities
- ✅ Vercel deployment ready
- ✅ **Build succeeds without errors**

**See:** [CHECKPOINT_4_SUMMARY.md](./CHECKPOINT_4_SUMMARY.md) for detailed verification results.

## 📋 Features

- **Customer Management** - Track customer information and contacts
- **Materials Catalog** - Manage materials, pricing, and suppliers
- **Quotation Management** - Create and manage project quotations
- **Project Tracking** - Monitor project progress and assignments
- **Material Requests** - Request materials for projects
- **Expense Tracking** - Track project costs and expenses
- **Invoice Management** - Generate and manage customer invoices
- **Project Reporting** - Create completion reports with signatures

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1.6 with App Router
- **Language:** TypeScript 5
- **Database:** Neon PostgreSQL (serverless)
- **Authentication:** NextAuth.js v5
- **UI Library:** shadcn/ui (Mira template)
- **Styling:** Tailwind CSS 4 (indigo theme)
- **Icons:** Tabler Icons
- **Validation:** Zod
- **Password Hashing:** Argon2

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- Neon PostgreSQL database access
- npm or yarn package manager

### Setup Steps

1. **Install dependencies:**
   ```bash
   cd nas
   npm install
   ```

2. **Configure environment variables:**
   
   Edit `.env.local` and add your values:
   ```bash
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   AUTH_SECRET="your-generated-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   Generate AUTH_SECRET:
   ```bash
   # PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   
   # Linux/Mac:
   openssl rand -base64 32
   ```

3. **Verify setup:**
   ```bash
   node verify-foundation.js
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Visit [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Verify Foundation

Run the comprehensive verification script:

```bash
node test-foundation-complete.js
```

This tests:
- ✅ Environment variables configured
- ✅ All dependencies installed
- ✅ Required files exist
- ✅ Build succeeds
- ✅ Deployment configuration correct

### Test Database Connection

Start the dev server and visit:
```
http://localhost:3000/api/test-db
```

Expected response:
```json
{
  "connected": true,
  "message": "Database connection successful",
  "tables": [...],
  "userCount": 1
}
```

### Test Authentication

1. Navigate to http://localhost:3000
2. You'll be redirected to `/login`
3. Enter credentials from your `auth_users` table
4. On success, you'll be redirected to `/dashboard`

## 🚀 Deployment

### Deploy to Vercel

**Option 1: Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your repository
3. Set root directory to `nas`
4. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (use your Vercel URL)
5. Click "Deploy"

**Option 2: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd nas
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add NEXTAUTH_URL

# Deploy to production
vercel --prod
```

### Deployment Verification

After deployment:
1. ✅ Visit your deployed URL
2. ✅ Verify redirect to `/login` works
3. ✅ Test database: `https://your-app.vercel.app/api/test-db`
4. ✅ Test authentication with valid credentials
5. ✅ Verify dashboard loads after login

## 📚 Documentation

### Setup & Configuration
- [QUICK_START.md](./QUICK_START.md) - 5-minute setup guide
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Detailed setup checklist
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

### Verification & Testing
- [CHECKPOINT_4_SUMMARY.md](./CHECKPOINT_4_SUMMARY.md) - Foundation verification results
- [FOUNDATION_VERIFICATION.md](./FOUNDATION_VERIFICATION.md) - Comprehensive verification report
- [AUTHENTICATION_TESTING.md](./AUTHENTICATION_TESTING.md) - Auth testing guide

### Technical Reference
- [DATABASE_SCHEMA_NOTES.md](./DATABASE_SCHEMA_NOTES.md) - Database schema documentation
- [Implementation Tasks](./.kiro/specs/nas-rebuild/tasks.md) - Full task list
- [Requirements](./.kiro/specs/nas-rebuild/requirements.md) - System requirements
- [Design](./.kiro/specs/nas-rebuild/design.md) - Architecture and design

## 🏗️ Project Structure

```
nas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   ├── shared/            # Reusable components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts              # Database connection
│   │   ├── auth.ts            # Authentication config
│   │   ├── validations.ts     # Zod schemas
│   │   └── utils.ts           # Utility functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── .env.local                 # Environment variables
├── vercel.json               # Vercel configuration
└── package.json              # Dependencies
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Building
npm run build        # Build for production
npm run start        # Start production server

# Testing
node verify-foundation.js           # Quick verification
node test-foundation-complete.js    # Comprehensive test
node test-build.js                  # Build test only

# Linting
npm run lint         # Run ESLint
```

## ⚠️ Known Issues

### Middleware Deprecation Warning

**Warning:** `The "middleware" file convention is deprecated. Please use "proxy" instead.`

- **Impact:** None - middleware still works correctly
- **Action:** Can be updated in future releases
- **Priority:** Low (not blocking)

## 🎯 Implementation Progress

### ✅ Completed Tasks

- [x] Task 1: Project initialization and deployment setup
- [x] Task 2: Database connection and authentication
  - [x] 2.1: Set up Neon PostgreSQL connection
  - [x] 2.2: Implement NextAuth.js authentication
- [x] Task 3: Core UI components and layout
  - [x] 3.1: Create shared layout components
  - [x] 3.2: Create reusable data table component
  - [x] 3.4: Create form validation utilities
- [x] Task 4: Checkpoint - Verify foundation ✅

### 🔜 Next Tasks

- [ ] Task 5: Customer management feature
- [ ] Task 6: Materials catalog feature
- [ ] Task 7: Dashboard feature
- [ ] Task 8: Checkpoint - Verify core features
- [ ] Task 9: Quotation management feature
- [ ] Task 10: Project management feature
- [ ] ...and more

See [tasks.md](./.kiro/specs/nas-rebuild/tasks.md) for the complete implementation plan.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Private - All rights reserved

---

**Last Updated:** February 8, 2026  
**Version:** 0.1.0  
**Status:** Foundation Complete ✅
