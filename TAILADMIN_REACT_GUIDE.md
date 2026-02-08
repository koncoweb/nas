# TailAdmin React/Next.js Implementation Guide

Ringkasan dokumentasi TailAdmin untuk implementasi di proyek NAS dengan React dan Next.js.

**Sumber**: [TailAdmin Documentation](https://tailadmin.com/docs)  
**Versi**: 2.2.x  
**Framework**: Next.js 16 + React 19 + TypeScript

---

## 📁 Struktur Folder TailAdmin

### Root Directory

```
/
├── src/                    # Source code
├── public/                 # Static assets (images, fonts, favicon)
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── package.json            # Dependencies & scripts
└── tsconfig.json           # TypeScript configuration
```

### Source Directory (src/)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group (login, signup)
│   ├── (dashboard)/       # Dashboard route group
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── charts/           # Chart components (ApexCharts)
│   ├── common/           # Common UI components
│   ├── form/             # Form elements
│   ├── header/           # Header components
│   ├── tables/           # Table components
│   └── ui/               # UI primitives
├── context/              # React Context providers
│   └── SidebarContext.tsx # Sidebar state management
├── hooks/                # Custom React hooks
├── icons/                # Icon components
└── layout/               # Layout components
    ├── DefaultLayout.tsx  # Main dashboard layout
    └── Sidebar.tsx        # Sidebar navigation
```

---

## 🎨 Layout System

### Layout Architecture

TailAdmin menggunakan **Flexbox** dengan **Tailwind CSS** untuk layout yang responsive.

#### Main Layout Structure

```tsx
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
```

### Key Layout Components

| Component | Role | CSS Behavior |
|-----------|------|--------------|
| **Wrapper** | Flex container | `flex h-screen overflow-hidden` - Full viewport height |
| **Sidebar** | Navigation menu | Fixed on mobile, static on desktop |
| **Header** | Top navigation | `sticky top-0 z-999` - Stays visible while scrolling |
| **Main** | Page content | `flex-1 overflow-y-auto` - Expands to fill space |

### Responsive Behavior

#### Desktop (lg: 1024px+)
- Sidebar: Static, always visible
- Width: `w-64` (256px)
- Content: Adjusts to remaining width

#### Mobile & Tablet (< 1024px)
- Sidebar: Fixed position with overlay
- Toggle: Hamburger menu
- Animation: `translate-x` for smooth transitions
- Backdrop: Dark overlay when open

---

## 🧩 Komponen TailAdmin untuk React

### 1. Alert

**Purpose**: Menampilkan feedback messages

**Props**:
```typescript
interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
}
```

**Usage**:
```tsx
<Alert
  variant="success"
  title="Success!"
  message="Your changes have been saved."
  showLink={true}
  linkHref="/details"
  linkText="View details"
/>
```

---

### 2. Avatar

**Purpose**: Menampilkan profile image atau initials

**Props**:
```typescript
interface AvatarProps {
  src: string;
  alt?: string;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
  status?: "online" | "offline" | "busy" | "none";
}
```

**Usage**:
```tsx
<Avatar
  src="/images/user.jpg"
  alt="John Doe"
  size="medium"
  status="online"
/>
```

---

### 3. Badge

**Purpose**: Status indicators, counts, labels

**Props**:
```typescript
interface BadgeProps {
  variant?: "light" | "solid";
  size?: "sm" | "md";
  color?: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Badge variant="solid" color="success" size="sm">
  Active
</Badge>

<Badge variant="light" color="warning">
  Pending
</Badge>
```

---

### 4. Breadcrumb

**Purpose**: Navigation paths

**Props**:
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: "default" | "withIcon" | "dotted" | "chevron";
}
```

**Usage**:
```tsx
<Breadcrumb
  variant="chevron"
  items={[
    { label: "Home", href: "/" },
    { label: "Customers", href: "/customers" },
    { label: "John Doe" }
  ]}
/>
```

---

### 5. Button

**Purpose**: Trigger actions, submit forms

**Props**:
```typescript
interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
```

**Usage**:
```tsx
<Button
  variant="primary"
  size="md"
  startIcon={<PlusIcon />}
  onClick={handleCreate}
>
  Create New
</Button>

<Button variant="outline" disabled>
  Loading...
</Button>
```

---

### 6. Card

**Purpose**: Display content in structured format

**Components**:
- `Card` - Container
- `CardTitle` - Title section
- `CardDescription` - Description text

**Usage**:
```tsx
<Card>
  <CardTitle>Customer Details</CardTitle>
  <CardDescription>
    View and manage customer information
  </CardDescription>
  <div className="mt-4">
    {/* Card content */}
  </div>
</Card>
```

---

### 7. Dropdown

**Purpose**: Display options menu

**Props**:
```typescript
// Dropdown
interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// DropdownItem
interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <DropdownItem onClick={handleEdit}>
    Edit
  </DropdownItem>
  <DropdownItem onClick={handleDelete}>
    Delete
  </DropdownItem>
</Dropdown>
```

---

### 8. Modal

**Purpose**: Popup overlay untuk focused interaction

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}
```

**Usage**:
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  showCloseButton={true}
>
  <h2 className="text-xl font-bold mb-4">Create Customer</h2>
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
  </form>
</Modal>
```

---

### 9. Table

**Purpose**: Display data in tabular format

**Components**:
- `Table` - Container
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableRow` - Row
- `TableCell` - Cell (th or td)

**Props**:
```typescript
interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
}
```

**Usage**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableCell isHeader>Name</TableCell>
      <TableCell isHeader>Email</TableCell>
      <TableCell isHeader>Status</TableCell>
    </TableRow>
  </TableHeader>
  <TableBody>
    {customers.map((customer) => (
      <TableRow key={customer.id}>
        <TableCell>{customer.name}</TableCell>
        <TableCell>{customer.email}</TableCell>
        <TableCell>
          <Badge color="success">Active</Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 10. Pagination

**Purpose**: Navigate through pages

**Usage**:
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

---

### 11. Tabs

**Purpose**: Organize content into sections

**Usage**:
```tsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="details">
    {/* Details content */}
  </TabsContent>
  <TabsContent value="history">
    {/* History content */}
  </TabsContent>
</Tabs>
```

---

### 12. Spinner

**Purpose**: Loading indicator

**Usage**:
```tsx
<Spinner size="md" />
```

---

### 13. Tooltip

**Purpose**: Additional information on hover

**Props**:
```typescript
interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "right" | "bottom" | "left";
  theme?: "light" | "dark";
}
```

**Usage**:
```tsx
<Tooltip content="Click to edit" position="top" theme="dark">
  <button>Edit</button>
</Tooltip>
```

---

## 🎨 TailAdmin Design System

### Color Palette

```typescript
// tailwind.config.ts
colors: {
  primary: '#3C50E0',      // Blue
  secondary: '#80CAEE',    // Light Blue
  success: '#10B981',      // Green
  warning: '#FFA70B',      // Orange
  danger: '#F87171',       // Red
  meta: {
    1: '#DC3545',          // Red
    2: '#EFF4FB',          // Light Blue
    3: '#10B981',          // Green
    4: '#313D4A',          // Dark Gray
  },
  stroke: '#E2E8F0',       // Border color
  body: '#64748B',         // Body text
  bodydark: '#AEB7C0',     // Body text dark mode
}
```

### Typography Classes

```css
/* Headings */
.text-title-xxl  /* Extra extra large title */
.text-title-xl   /* Extra large title */
.text-title-lg   /* Large title */
.text-title-md   /* Medium title */
.text-title-sm   /* Small title */

/* Body Text */
.text-base       /* Base text size */
.text-sm         /* Small text */
.text-xs         /* Extra small text */

/* Colors */
.text-black dark:text-white        /* Primary text */
.text-body dark:text-bodydark      /* Secondary text */
.text-bodydark1 dark:text-bodydark /* Tertiary text */
```

### Spacing System

```css
/* Padding */
.p-4      /* 1rem (16px) */
.p-6      /* 1.5rem (24px) */
.p-7.5    /* 1.875rem (30px) */
.p-10     /* 2.5rem (40px) */

/* Margin */
.m-4      /* 1rem */
.m-6      /* 1.5rem */
.m-10     /* 2.5rem */

/* Gap */
.gap-4    /* 1rem */
.gap-6    /* 1.5rem */
.gap-7.5  /* 1.875rem */
```

### Border Radius

```css
.rounded-sm    /* 0.125rem (2px) */
.rounded       /* 0.25rem (4px) */
.rounded-md    /* 0.375rem (6px) */
.rounded-lg    /* 0.5rem (8px) */
.rounded-full  /* 9999px (circle) */
```

---

## 🎯 TailAdmin Patterns untuk NAS

### 1. Card Pattern

**TailAdmin Style**:
```tsx
<div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
  <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
    <IconComponent />
  </div>
  <div className="mt-4 flex items-end justify-between">
    <div>
      <h4 className="text-title-md font-bold text-black dark:text-white">
        {value}
      </h4>
      <span className="text-sm font-medium">{label}</span>
    </div>
  </div>
</div>
```

### 2. Table Pattern

**TailAdmin Style**:
```tsx
<div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
  {/* Table Header */}
  <div className="px-4 py-6 md:px-6 xl:px-7.5">
    <h4 className="text-xl font-semibold text-black dark:text-white">
      {title}
    </h4>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full table-auto">
      <thead>
        <tr className="bg-gray-2 text-left dark:bg-meta-4">
          <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
            Column Name
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 3. Form Pattern

**TailAdmin Style**:
```tsx
<div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
  <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
    <h3 className="font-medium text-black dark:text-white">
      Form Title
    </h3>
  </div>
  <form onSubmit={handleSubmit}>
    <div className="p-6.5">
      {/* Form Fields */}
      <div className="mb-4.5">
        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
          Field Label
        </label>
        <input
          type="text"
          className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        />
      </div>

      {/* Submit Button */}
      <button className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
        Submit
      </button>
    </div>
  </form>
</div>
```

### 4. Button Variants

```tsx
// Primary
<button className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
  Primary Button
</button>

// Secondary (Outline)
<button className="inline-flex items-center justify-center rounded-md border border-primary px-10 py-4 text-center font-medium text-primary hover:bg-opacity-90 lg:px-8 xl:px-10">
  Secondary Button
</button>

// Danger
<button className="inline-flex items-center justify-center rounded-md bg-meta-1 px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
  Delete
</button>
```

### 5. Badge Variants

```tsx
// Success
<span className="inline-flex rounded-full bg-success bg-opacity-10 px-3 py-1 text-sm font-medium text-success">
  Active
</span>

// Warning
<span className="inline-flex rounded-full bg-warning bg-opacity-10 px-3 py-1 text-sm font-medium text-warning">
  Pending
</span>

// Danger
<span className="inline-flex rounded-full bg-danger bg-opacity-10 px-3 py-1 text-sm font-medium text-danger">
  Rejected
</span>
```

---

## 🔧 Context & State Management

### SidebarContext

TailAdmin menggunakan React Context untuk manage sidebar state (mobile).

**Implementation**:
```tsx
// context/SidebarContext.tsx
import { createContext, useContext, useState } from 'react';

interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}
```

**Usage in Layout**:
```tsx
// app/layout.tsx
import { SidebarProvider } from '@/context/SidebarContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
```

**Usage in Sidebar**:
```tsx
// components/Sidebar.tsx
import { useSidebar } from '@/context/SidebarContext';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  return (
    <aside
      className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ...`}
    >
      {/* Sidebar content */}
    </aside>
  );
}
```

---

## 📱 Responsive Design Best Practices

### Mobile-First Approach

```tsx
// Start with mobile styles, add desktop with lg:
<div className="p-4 md:p-6 lg:p-10">
  {/* Content */}
</div>
```

### Breakpoints

```typescript
// Tailwind breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large
2xl: '1536px' // 2X Extra large
```

### Responsive Grid

```tsx
// 1 column mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

---

## 🌙 Dark Mode

### Implementation

TailAdmin uses `dark:` prefix for dark mode styles.

**Example**:
```tsx
<div className="bg-white text-black dark:bg-boxdark dark:text-white">
  <h1 className="text-title-xl text-black dark:text-white">
    Title
  </h1>
  <p className="text-body dark:text-bodydark">
    Content
  </p>
</div>
```

### Dark Mode Colors

```css
/* Background */
.dark:bg-boxdark        /* Main background */
.dark:bg-boxdark-2      /* Secondary background */

/* Text */
.dark:text-white        /* Primary text */
.dark:text-bodydark     /* Secondary text */

/* Borders */
.dark:border-strokedark /* Border color */
```

---

## 🎯 Implementasi untuk NAS

### 1. Sidebar Menu untuk NAS

```tsx
const menuGroups = [
  {
    name: "MENU",
    menuItems: [
      {
        icon: <LayoutDashboard size={18} />,
        label: "Dashboard",
        route: "/dashboard",
      },
      {
        icon: <Users size={18} />,
        label: "Customers",
        route: "/customers",
      },
      {
        icon: <Package size={18} />,
        label: "Materials",
        route: "/materials",
      },
      {
        icon: <FileText size={18} />,
        label: "Quotations",
        route: "/quotations",
      },
      {
        icon: <Briefcase size={18} />,
        label: "Projects",
        route: "/projects",
      },
      {
        icon: <ClipboardList size={18} />,
        label: "Material Requests",
        route: "/material-requests",
      },
      {
        icon: <Receipt size={18} />,
        label: "Invoices",
        route: "/invoices",
      },
      {
        icon: <FileCheck size={18} />,
        label: "Reports",
        route: "/reports",
      },
    ],
  },
];
```

### 2. Dashboard Stats Cards

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
  <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
      <Users className="fill-primary" />
    </div>
    <div className="mt-4 flex items-end justify-between">
      <div>
        <h4 className="text-title-md font-bold text-black dark:text-white">
          {totalCustomers}
        </h4>
        <span className="text-sm font-medium">Total Customers</span>
      </div>
    </div>
  </div>
  {/* More cards */}
</div>
```

### 3. Data Table untuk NAS

```tsx
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
          <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
            Name
          </th>
          <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
            Email
          </th>
          <th className="px-4 py-4 font-medium text-black dark:text-white">
            Status
          </th>
          <th className="px-4 py-4 font-medium text-black dark:text-white">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
              <h5 className="font-medium text-black dark:text-white">
                {customer.name}
              </h5>
            </td>
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
              <p className="text-black dark:text-white">
                {customer.email}
              </p>
            </td>
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
              <span className="inline-flex rounded-full bg-success bg-opacity-10 px-3 py-1 text-sm font-medium text-success">
                {customer.status}
              </span>
            </td>
            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
              <div className="flex items-center space-x-3.5">
                <button className="hover:text-primary">
                  <Edit size={18} />
                </button>
                <button className="hover:text-danger">
                  <Trash size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 📚 Resources

### Official Documentation
- **TailAdmin Docs**: https://tailadmin.com/docs
- **Components**: https://tailadmin.com/docs/components/nextjs
- **Folder Structure**: https://tailadmin.com/docs/folder-structure/nextjs
- **App Layout**: https://tailadmin.com/docs/app-layout

### External Resources
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev

---

## ✅ Checklist Implementasi

### Setup
- [ ] Copy template ke nas-new
- [ ] Install dependencies
- [ ] Setup environment variables
- [ ] Configure tailwind.config.ts

### Layout
- [ ] Implement DefaultLayout
- [ ] Implement Sidebar dengan menu NAS
- [ ] Implement Header dengan NextAuth
- [ ] Setup SidebarContext
- [ ] Test responsive behavior

### Components
- [ ] Migrate Card pattern
- [ ] Migrate Table pattern
- [ ] Migrate Form pattern
- [ ] Migrate Button variants
- [ ] Migrate Badge variants
- [ ] Migrate Modal
- [ ] Migrate Dropdown

### Pages
- [ ] Dashboard dengan stats cards
- [ ] Customers list & detail
- [ ] Materials list & detail
- [ ] Quotations list & detail
- [ ] Projects list & detail
- [ ] Material Requests
- [ ] Invoices
- [ ] Reports

### Testing
- [ ] Test all CRUD operations
- [ ] Test responsive design
- [ ] Test dark mode
- [ ] Test authentication
- [ ] Test role-based access

---

**Status**: ✅ Ready for Implementation  
**Last Updated**: February 2026

---

**Catatan**: Dokumentasi ini adalah ringkasan dari TailAdmin official docs yang disesuaikan untuk implementasi di proyek NAS dengan React/Next.js. Selalu refer ke official docs untuk informasi terbaru.
