# Panduan Migrasi NAS ke TailAdmin Template

## Daftar Isi
1. [Persiapan](#persiapan)
2. [Migrasi Layout](#migrasi-layout)
3. [Migrasi Authentication](#migrasi-authentication)
4. [Migrasi Fitur per Modul](#migrasi-fitur-per-modul)
5. [Testing Checklist](#testing-checklist)

---

## Persiapan

### 1. Setup Environment

```bash
# Clone template
setup-template.bat

# Preview template
cd template/free-nextjs-admin-dashboard
npm run dev
# Buka http://localhost:3000 untuk melihat template

# Setup project baru
cd ../..
setup-nas-new.bat
```

### 2. Verifikasi File Konfigurasi

File yang sudah di-copy dari `/nas`:
- ✅ `.env.local` - Database & auth secrets
- ✅ `src/lib/db.ts` - Neon database connection
- ✅ `src/lib/auth.ts` - NextAuth configuration
- ✅ `src/lib/validations.ts` - Zod schemas
- ✅ `src/types/index.ts` - TypeScript types
- ✅ `src/middleware.ts` - Auth middleware

### 3. Install Dependencies Tambahan

```bash
cd nas-new
npm install --legacy-peer-deps @neondatabase/serverless next-auth@beta argon2 zod date-fns @react-pdf/renderer docx
```

---

## Migrasi Layout

### Fase 1: Sidebar Navigation

**File Template**: `nas-new/src/components/Sidebar/index.tsx`

**Modifikasi Menu Items**:

```typescript
// Ganti menu items dengan menu NAS
const menuGroups = [
  {
    name: "MENU",
    menuItems: [
      {
        icon: <LayoutDashboard />,
        label: "Dashboard",
        route: "/dashboard",
      },
      {
        icon: <Users />,
        label: "Customers",
        route: "/customers",
      },
      {
        icon: <Package />,
        label: "Materials",
        route: "/materials",
      },
      {
        icon: <FileText />,
        label: "Quotations",
        route: "/quotations",
      },
      {
        icon: <Briefcase />,
        label: "Projects",
        route: "/projects",
      },
      {
        icon: <ClipboardList />,
        label: "Material Requests",
        route: "/material-requests",
      },
      {
        icon: <Receipt />,
        label: "Invoices",
        route: "/invoices",
      },
      {
        icon: <FileCheck />,
        label: "Reports",
        route: "/reports",
      },
    ],
  },
  {
    name: "SETTINGS",
    menuItems: [
      {
        icon: <Settings />,
        label: "Settings",
        route: "/settings",
      },
    ],
  },
];
```

**Role-based Menu Visibility**:

```typescript
// Tambahkan role checking
import { useSession } from "next-auth/react";

const Sidebar = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredMenuItems = menuGroups.map(group => ({
    ...group,
    menuItems: group.menuItems.filter(item => {
      // Leader: semua akses
      if (userRole === 'leader') return true;
      
      // Sales: dashboard, customers, quotations, projects
      if (userRole === 'sales') {
        return ['dashboard', 'customers', 'quotations', 'projects'].some(
          route => item.route.includes(route)
        );
      }
      
      // Accounting: dashboard, invoices, financial
      if (userRole === 'accounting') {
        return ['dashboard', 'invoices', 'financial'].some(
          route => item.route.includes(route)
        );
      }
      
      // Engineer: dashboard, projects, material-requests, reports
      if (userRole === 'engineer') {
        return ['dashboard', 'projects', 'material-requests', 'reports'].some(
          route => item.route.includes(route)
        );
      }
      
      return false;
    })
  }));

  return (
    // ... render sidebar dengan filteredMenuItems
  );
};
```

### Fase 2: Header Component

**File Template**: `nas-new/src/components/Header/index.tsx`

**Modifikasi User Dropdown**:

```typescript
// Tambahkan user info dari session
import { useSession, signOut } from "next-auth/react";

const Header = () => {
  const { data: session } = useSession();

  return (
    <header>
      {/* ... existing header code */}
      
      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-gray-500">{session?.user?.role}</p>
            </div>
            <Avatar>
              <AvatarFallback>
                {session?.user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
```

### Fase 3: Dashboard Layout

**File Baru**: `nas-new/src/app/(dashboard)/layout.tsx`

```typescript
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## Migrasi Authentication

### File: `nas-new/src/app/(auth)/login/page.tsx`

**Gunakan design TailAdmin, logic dari NAS**:

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Marine Engineering
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Project Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 border-t pt-6">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Demo Accounts:
          </p>
          <div className="space-y-2 text-xs text-gray-500">
            <p>Leader: leader@nas.com / password123</p>
            <p>Sales: sales@nas.com / password123</p>
            <p>Accounting: accounting@nas.com / password123</p>
            <p>Engineer: engineer@nas.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Migrasi Fitur per Modul

### 1. Dashboard

**File**: `nas-new/src/app/(dashboard)/dashboard/page.tsx`

**Komponen yang digunakan**:
- Cards dari TailAdmin untuk statistics
- Charts dari TailAdmin untuk visualisasi
- API endpoint dari NAS (`/api/dashboard`)

**Langkah**:
1. Copy `nas/src/app/(dashboard)/dashboard/page.tsx` ke `nas-new`
2. Ganti Card components dengan TailAdmin Card design
3. Integrate Chart.js untuk charts
4. Keep API logic sama

### 2. Customers

**Files**:
- `nas-new/src/app/(dashboard)/customers/page.tsx` - List page
- `nas-new/src/app/(dashboard)/customers/[id]/page.tsx` - Detail page
- `nas-new/src/components/customers/` - Components

**Langkah**:
1. Copy semua files dari `nas/src/app/(dashboard)/customers/`
2. Copy components dari `nas/src/components/customers/`
3. Ganti Table component dengan TailAdmin Table design
4. Ganti Modal dengan TailAdmin Modal
5. Keep API endpoints sama (`/api/customers`)

**Table Design Update**:
```typescript
// Gunakan TailAdmin table styling
<div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
  <div className="px-4 py-6 md:px-6 xl:px-7.5">
    <h4 className="text-xl font-semibold text-black dark:text-white">
      Customers
    </h4>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full table-auto">
      <thead>
        <tr className="bg-gray-2 text-left dark:bg-meta-4">
          <th className="px-4 py-4 font-medium text-black dark:text-white">
            Name
          </th>
          {/* ... other columns */}
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
              {customer.name}
            </td>
            {/* ... other cells */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 3. Materials

**Sama seperti Customers**, copy dan update styling:
- List page dengan search & filter
- Create/Edit modal
- Table dengan TailAdmin design
- Keep API logic

### 4. Quotations

**Files**:
- List page
- Create page (multi-step form)
- Detail page
- Line items table
- Scope of work form

**Langkah**:
1. Copy semua files quotations
2. Update form styling dengan TailAdmin
3. Keep validation logic (Zod)
4. Keep API endpoints
5. Keep PDF/DOCX export functionality

### 5. Projects

**Komponen khusus**:
- Project cards (gunakan TailAdmin card design)
- Timeline component (custom atau dari TailAdmin)
- Status badges (TailAdmin badges)

### 6. Material Requests

**Workflow approval** tetap sama, update UI:
- Request form
- Approval buttons
- Status indicators

### 7. Invoices

**Keep**:
- Payment tracking logic
- PDF generation
- Line items calculation

**Update**:
- Table design
- Form styling
- Modal design

### 8. Reports

**Keep**:
- File upload functionality
- Signature capture
- Approval workflow

**Update**:
- Form layout
- File preview
- Status indicators

---

## Testing Checklist

### Authentication
- [ ] Login dengan semua role (leader, sales, accounting, engineer)
- [ ] Logout functionality
- [ ] Protected routes (redirect ke login jika belum auth)
- [ ] Role-based menu visibility
- [ ] Session persistence

### CRUD Operations
- [ ] **Customers**: Create, Read, Update, Delete
- [ ] **Materials**: Create, Read, Update, Delete
- [ ] **Quotations**: Create, Read, Update, Delete, Convert to Project
- [ ] **Projects**: Create, Read, Update, Delete
- [ ] **Material Requests**: Create, Read, Approve, Reject
- [ ] **Invoices**: Create, Read, Update, Add Payment
- [ ] **Reports**: Create, Read, Approve

### Complex Features
- [ ] Quotation line items (add, edit, delete)
- [ ] Quotation scope of work
- [ ] Invoice line items
- [ ] Invoice payment tracking
- [ ] Material request approval workflow
- [ ] Project timeline
- [ ] Report file upload
- [ ] Report signature capture

### Export Features
- [ ] Quotation PDF export
- [ ] Quotation DOCX export
- [ ] Invoice PDF export

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode toggle
- [ ] Loading states
- [ ] Error messages
- [ ] Success notifications
- [ ] Form validation messages
- [ ] Empty states
- [ ] Pagination

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] No console errors
- [ ] No memory leaks

### Database
- [ ] All queries use parameterized SQL
- [ ] Transactions for multi-step operations
- [ ] Foreign key constraints working
- [ ] Data integrity maintained

---

## Troubleshooting

### Issue: Styling conflicts
**Solution**: Check Tailwind config, ensure TailAdmin classes don't conflict with shadcn/ui

### Issue: API endpoints not working
**Solution**: Verify middleware.ts is configured correctly, check auth headers

### Issue: Database connection errors
**Solution**: Verify DATABASE_URL in .env.local, check Neon project status

### Issue: Build errors
**Solution**: Run `npm run build` to identify TypeScript errors, fix before deployment

---

## Deployment

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured in Vercel
- [ ] Database backup created
- [ ] Build successful locally

### Deployment Steps
1. Push code to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy to staging
5. Run smoke tests
6. Deploy to production

---

## Rollback Plan

Jika terjadi masalah serius:
1. Vercel: Rollback ke deployment sebelumnya
2. Database: Restore dari backup
3. Code: Revert ke commit sebelumnya
4. Notify users tentang maintenance

---

## Support & Documentation

- **Template Documentation**: https://tailadmin.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **NextAuth.js Documentation**: https://next-auth.js.org
- **Neon Documentation**: https://neon.tech/docs

---

**Catatan Penting**: 
- Jangan hapus folder `/nas` sampai `/nas-new` fully tested dan deployed
- Backup database sebelum testing
- Test di staging environment dulu sebelum production
- Dokumentasikan setiap perubahan yang dibuat
