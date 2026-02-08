# Component Mapping: NAS Current → TailAdmin Template

Panduan mapping komponen dari aplikasi NAS saat ini ke TailAdmin template untuk memudahkan proses migrasi.

---

## Layout Components

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/layout/Sidebar.tsx` | `src/components/Sidebar/index.tsx` | **Replace** | Update menu items dengan NAS menu |
| `src/components/layout/Header.tsx` | `src/components/Header/index.tsx` | **Replace** | Integrate NextAuth session |
| `src/app/(dashboard)/layout.tsx` | `src/app/layout.tsx` | **Merge** | Combine layouts |

---

## UI Components

### Cards & Containers

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/ui/card.tsx` (shadcn) | TailAdmin Card classes | **Hybrid** | Use TailAdmin styling, keep shadcn structure |
| Dashboard stat cards | `src/components/DataStats/DataStatsOne.tsx` | **Adopt** | Use TailAdmin design |
| Project cards | `src/components/Cards/` | **Adopt** | Use TailAdmin card variants |

**TailAdmin Card Pattern**:
```tsx
<div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
  <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
    {/* Icon */}
  </div>
  <div className="mt-4 flex items-end justify-between">
    <div>
      <h4 className="text-title-md font-bold text-black dark:text-white">
        {value}
      </h4>
      <span className="text-sm font-medium">{label}</span>
    </div>
    {/* Optional trend indicator */}
  </div>
</div>
```

### Tables

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/shared/DataTable.tsx` | `src/components/Tables/` | **Merge** | Use TailAdmin styling + NAS logic |
| `src/components/customers/CustomerTable.tsx` | TailAdmin Table pattern | **Update** | Apply TailAdmin classes |
| `src/components/materials/MaterialTable.tsx` | TailAdmin Table pattern | **Update** | Apply TailAdmin classes |

**TailAdmin Table Pattern**:
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
          {/* More columns */}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
              {item.value}
            </td>
            {/* More cells */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### Forms

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/customers/CustomerForm.tsx` | `src/components/Forms/` | **Merge** | Use TailAdmin styling + Zod validation |
| `src/components/quotations/QuotationForm.tsx` | TailAdmin Form pattern | **Update** | Multi-step form with TailAdmin design |
| `src/components/ui/input.tsx` (shadcn) | TailAdmin Input classes | **Hybrid** | Keep shadcn, add TailAdmin classes |

**TailAdmin Form Pattern**:
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

### Buttons

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/ui/button.tsx` (shadcn) | TailAdmin Button classes | **Hybrid** | Keep shadcn variants, add TailAdmin styling |

**TailAdmin Button Variants**:
```tsx
// Primary
<button className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
  Primary Button
</button>

// Secondary
<button className="inline-flex items-center justify-center rounded-md border border-primary px-10 py-4 text-center font-medium text-primary hover:bg-opacity-90 lg:px-8 xl:px-10">
  Secondary Button
</button>

// Danger
<button className="inline-flex items-center justify-center rounded-md bg-meta-1 px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
  Delete
</button>
```

### Modals/Dialogs

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/ui/dialog.tsx` (shadcn) | TailAdmin Modal pattern | **Hybrid** | Keep shadcn Dialog, style with TailAdmin |
| `src/components/customers/CustomerModal.tsx` | TailAdmin Modal | **Update** | Apply TailAdmin styling |

### Badges & Status

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/ui/badge.tsx` (shadcn) | TailAdmin Badge classes | **Replace** | Use TailAdmin color system |

**TailAdmin Badge Pattern**:
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

### Dropdowns

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/ui/dropdown-menu.tsx` (shadcn) | `src/components/DropdownDefault.tsx` | **Hybrid** | Keep shadcn, style with TailAdmin |
| `src/components/ui/select.tsx` (shadcn) | TailAdmin Select pattern | **Hybrid** | Keep shadcn, style with TailAdmin |

---

## Page Components

### Dashboard

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/app/(dashboard)/dashboard/page.tsx` | `src/app/page.tsx` (TailAdmin) | **Merge** | Use TailAdmin charts + NAS data |
| Dashboard cards | `src/components/DataStats/` | **Adopt** | Use TailAdmin DataStats |
| Charts (if any) | `src/components/Charts/` | **Adopt** | Use Chart.js integration |

**TailAdmin Dashboard Pattern**:
```tsx
<>
  {/* Stats Cards */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
    <DataStatsOne />
  </div>

  {/* Charts */}
  <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
    <ChartOne />
    <ChartTwo />
  </div>

  {/* Tables */}
  <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
    <TableOne />
  </div>
</>
```

### List Pages (Customers, Materials, etc.)

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/app/(dashboard)/customers/page.tsx` | `src/app/tables/page.tsx` | **Merge** | Use TailAdmin table + NAS logic |
| Search & filters | `src/components/shared/SearchBar.tsx` | **Update** | Style with TailAdmin |
| Pagination | `src/components/shared/Pagination.tsx` | **Update** | Style with TailAdmin |

### Form Pages (Create/Edit)

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/app/(dashboard)/quotations/new/page.tsx` | `src/app/forms/` | **Merge** | Use TailAdmin form layout + NAS validation |
| Multi-step forms | Custom implementation | **Keep** | Add TailAdmin styling |

### Detail Pages

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/app/(dashboard)/customers/[id]/page.tsx` | Custom layout | **Keep** | Add TailAdmin card styling |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Custom layout | **Keep** | Add TailAdmin styling |

---

## Shared Components

### Loading States

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/shared/LoadingState.tsx` | TailAdmin Loader | **Replace** | Use TailAdmin spinner |
| `src/components/shared/TableSkeleton.tsx` | Custom skeleton | **Keep** | Add TailAdmin styling |

**TailAdmin Loader**:
```tsx
<div className="flex h-screen items-center justify-center bg-white dark:bg-black">
  <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
</div>
```

### Pagination

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/shared/Pagination.tsx` | Custom pagination | **Update** | Style with TailAdmin |

**TailAdmin Pagination Pattern**:
```tsx
<div className="flex items-center justify-between border-t border-stroke px-4 py-3 dark:border-strokedark sm:px-6">
  <div className="flex flex-1 justify-between sm:hidden">
    <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
      Previous
    </button>
    <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
      Next
    </button>
  </div>
  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
    <div>
      <p className="text-sm text-gray-700">
        Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
        <span className="font-medium">97</span> results
      </p>
    </div>
    <div>
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
        {/* Page numbers */}
      </nav>
    </div>
  </div>
</div>
```

### Search Bar

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| `src/components/shared/SearchBar.tsx` | Header search | **Update** | Style with TailAdmin |

---

## Charts & Visualizations

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| None (or basic) | `src/components/Charts/ChartOne.tsx` | **Adopt** | Use Chart.js for dashboard |
| None | `src/components/Charts/ChartTwo.tsx` | **Adopt** | Bar chart for analytics |
| None | `src/components/Charts/ChartThree.tsx` | **Adopt** | Pie chart for distribution |

**Chart.js Integration**:
```tsx
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartOne = () => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <Line data={data} />
    </div>
  );
};
```

---

## Icons

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| Tabler Icons | Heroicons | **Keep Tabler** | More comprehensive icon set |

**Import Pattern**:
```tsx
// Keep using Tabler Icons
import { IconUsers, IconPackage, IconFileText } from '@tabler/icons-react';
```

---

## Color System

### NAS Current (Indigo Theme)
```css
--primary: indigo-600
--secondary: gray-600
--success: green-600
--warning: yellow-600
--danger: red-600
```

### TailAdmin (Blue/Purple Theme)
```css
--primary: #3C50E0 (blue)
--secondary: #80CAEE (light blue)
--success: #10B981 (green)
--warning: #FFA70B (orange)
--danger: #F87171 (red)
--meta-1: #DC3545 (red)
--meta-2: #EFF4FB (light blue)
--meta-3: #10B981 (green)
--meta-4: #313D4A (dark gray)
```

**Action**: Update `tailwind.config.js` to use TailAdmin colors

---

## Typography

### TailAdmin Typography Classes
```tsx
// Headings
<h1 className="text-title-xxl font-bold text-black dark:text-white">
<h2 className="text-title-xl font-bold text-black dark:text-white">
<h3 className="text-title-lg font-bold text-black dark:text-white">
<h4 className="text-title-md font-bold text-black dark:text-white">

// Body text
<p className="text-base text-body">
<p className="text-sm text-bodydark">

// Labels
<label className="mb-3 block text-sm font-medium text-black dark:text-white">
```

---

## Dark Mode

| NAS Current | TailAdmin Template | Action | Notes |
|-------------|-------------------|--------|-------|
| Basic dark mode | Full dark mode support | **Adopt** | Use TailAdmin dark mode classes |

**TailAdmin Dark Mode Pattern**:
```tsx
// All components use dark: prefix
<div className="bg-white dark:bg-boxdark">
  <h1 className="text-black dark:text-white">Title</h1>
  <p className="text-body dark:text-bodydark">Content</p>
</div>
```

---

## Migration Priority

### Phase 1: High Priority (Week 1-2)
1. ✅ Layout (Sidebar, Header)
2. ✅ Authentication (Login page)
3. ✅ Dashboard (Stats cards, charts)
4. ✅ Customers (List, Create, Edit, Delete)
5. ✅ Materials (List, Create, Edit, Delete)

### Phase 2: Medium Priority (Week 2-3)
6. ✅ Quotations (List, Create, Edit, Line items)
7. ✅ Projects (List, Create, Edit, Timeline)
8. ✅ Material Requests (List, Create, Approve)

### Phase 3: Lower Priority (Week 3-4)
9. ✅ Invoices (List, Create, Payment)
10. ✅ Reports (List, Create, Approve)
11. ✅ Settings (Profile, System settings)

---

## Quick Reference: Class Replacements

| Element | NAS/shadcn | TailAdmin | Notes |
|---------|-----------|-----------|-------|
| Container | `container mx-auto` | `mx-auto max-w-screen-2xl` | TailAdmin uses max-w |
| Card | `rounded-lg border bg-card` | `rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark` | More specific |
| Button Primary | `bg-primary text-primary-foreground` | `bg-primary text-white hover:bg-opacity-90` | Similar |
| Input | `border-input` | `border-[1.5px] border-stroke` | More specific |
| Text Primary | `text-foreground` | `text-black dark:text-white` | Explicit colors |
| Text Secondary | `text-muted-foreground` | `text-body dark:text-bodydark` | Custom classes |

---

## Testing Checklist per Component

For each migrated component:
- [ ] Visual appearance matches TailAdmin design
- [ ] Functionality preserved from NAS
- [ ] Dark mode working
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] TypeScript types correct
- [ ] Accessibility maintained

---

## Resources

- **TailAdmin Components**: https://tailadmin.com/docs/components/nextjs
- **TailAdmin GitHub**: https://github.com/TailAdmin/free-nextjs-admin-dashboard
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tailwind CSS Docs**: https://tailwindcss.com/docs

---

**Tips**:
1. Start with layout components (Sidebar, Header) first
2. Migrate one module at a time (e.g., complete Customers before moving to Materials)
3. Test each component after migration
4. Keep original NAS files as reference
5. Document any custom modifications
