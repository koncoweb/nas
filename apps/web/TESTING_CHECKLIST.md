# Testing Checklist - Styling Update

## ✅ Visual Testing

### Warna
- [ ] Primary blue (#2563eb) terlihat di semua button utama
- [ ] Hover states menggunakan primary-700 (#1d4ed8)
- [ ] Text menggunakan neutral-900 (#171717)
- [ ] Background menggunakan neutral-50 (#fafafa)
- [ ] Border menggunakan neutral-300

### Icon
- [ ] Semua icon menggunakan stroke (line style)
- [ ] Icon size konsisten (w-5 h-5 untuk normal, w-4 h-4 untuk small)
- [ ] Icon color sesuai dengan konteks (primary-600, neutral-600, dll)

### Spacing
- [ ] Button padding konsisten (px-4 py-2)
- [ ] Card padding konsisten (p-6)
- [ ] Margin antar elemen harmonis
- [ ] Gap di grid/flex konsisten

### Border Radius
- [ ] Button menggunakan rounded-lg
- [ ] Card menggunakan rounded-xl
- [ ] Input menggunakan rounded-lg
- [ ] Badge menggunakan rounded-full

### Shadow
- [ ] Card menggunakan shadow-sm
- [ ] Card hover menggunakan shadow-md
- [ ] Button menggunakan shadow-sm
- [ ] Tidak ada shadow yang terlalu kuat

### Transitions
- [ ] Semua hover effects smooth
- [ ] Duration konsisten (200ms)
- [ ] Focus states muncul dengan smooth
- [ ] No janky animations

## ✅ Functional Testing

### Navigation
- [ ] Semua link masih berfungsi
- [ ] Routing tidak berubah
- [ ] Breadcrumb masih bekerja
- [ ] Back button berfungsi normal

### Forms
- [ ] Input fields bisa diisi
- [ ] Select dropdown berfungsi
- [ ] Textarea bisa diisi
- [ ] Form validation masih jalan
- [ ] Submit button berfungsi
- [ ] Error messages muncul dengan benar

### Buttons
- [ ] Primary button bisa diklik
- [ ] Secondary button berfungsi
- [ ] Outline button bekerja
- [ ] Icon button responsive
- [ ] Disabled state terlihat jelas

### Modals
- [ ] Modal bisa dibuka
- [ ] Modal bisa ditutup
- [ ] Backdrop berfungsi
- [ ] Form di modal masih bekerja
- [ ] Scroll di modal normal

### Tables
- [ ] Data tampil dengan benar
- [ ] Sorting masih berfungsi
- [ ] Filtering bekerja
- [ ] Pagination normal
- [ ] Row hover terlihat jelas
- [ ] Action buttons di table berfungsi

### Cards
- [ ] Card hover effect smooth
- [ ] Content di card terbaca
- [ ] Button di card berfungsi
- [ ] Link di card bekerja

## ✅ Responsive Testing

### Mobile (< 640px)
- [ ] Layout tidak pecah
- [ ] Text terbaca dengan jelas
- [ ] Button tidak terlalu kecil
- [ ] Form input mudah diisi
- [ ] Navigation mobile bekerja
- [ ] Modal fit di screen

### Tablet (640px - 1024px)
- [ ] Grid layout optimal
- [ ] Spacing proporsional
- [ ] Card size sesuai
- [ ] Table scrollable jika perlu

### Desktop (> 1024px)
- [ ] Layout maksimal
- [ ] Spacing tidak terlalu lebar
- [ ] Content centered dengan baik
- [ ] Sidebar (jika ada) proporsional

## ✅ Browser Testing

### Chrome
- [ ] Tampilan normal
- [ ] Hover effects bekerja
- [ ] Focus states terlihat
- [ ] Transitions smooth

### Firefox
- [ ] Tampilan konsisten dengan Chrome
- [ ] Select dropdown styling benar
- [ ] Border radius terlihat
- [ ] Shadow rendering baik

### Safari
- [ ] Warna akurat
- [ ] Border radius smooth
- [ ] Transitions tidak lag
- [ ] Input styling konsisten

### Edge
- [ ] Kompatibilitas penuh
- [ ] Styling konsisten
- [ ] Performance baik

## ✅ Accessibility Testing

### Keyboard Navigation
- [ ] Tab order logis
- [ ] Focus visible jelas (ring-2 ring-primary-500)
- [ ] Enter/Space berfungsi di button
- [ ] Escape menutup modal

### Screen Reader
- [ ] Button labels jelas
- [ ] Form labels terbaca
- [ ] Error messages announced
- [ ] Status changes announced

### Color Contrast
- [ ] Text readable (WCAG AA minimum)
- [ ] Button text kontras tinggi
- [ ] Link terlihat jelas
- [ ] Disabled state terlihat

## ✅ Performance Testing

### Load Time
- [ ] CSS bundle size reasonable
- [ ] No unused Tailwind classes
- [ ] Page load tidak lebih lambat
- [ ] Images optimized

### Runtime
- [ ] No layout shifts
- [ ] Smooth scrolling
- [ ] Hover tidak lag
- [ ] Transitions performant

## ✅ Specific Pages Testing

### Dashboard/Home
- [ ] Cards tampil dengan baik
- [ ] Stats readable
- [ ] Charts (jika ada) tidak rusak
- [ ] Quick actions berfungsi

### Customers
- [ ] Table styling modern
- [ ] Search berfungsi
- [ ] Filter bekerja
- [ ] Add customer modal OK
- [ ] Edit customer modal OK

### Invoices
- [ ] List view bagus
- [ ] Detail view lengkap
- [ ] PDF generation masih jalan
- [ ] Payment modal berfungsi

### Materials
- [ ] Table modern
- [ ] Add material form OK
- [ ] Edit material berfungsi
- [ ] Delete confirmation muncul

### Projects
- [ ] Project cards menarik
- [ ] Detail page lengkap
- [ ] Status badges jelas
- [ ] Actions berfungsi

### Quotations
- [ ] Form multi-step OK
- [ ] Preview tampil baik
- [ ] PDF generation jalan
- [ ] Convert to project berfungsi

### Reports
- [ ] Report list modern
- [ ] Create report form OK
- [ ] Approval workflow jelas
- [ ] PDF export berfungsi

### Settings
- [ ] Form settings OK
- [ ] Save berfungsi
- [ ] Validation bekerja

## ✅ Edge Cases

### Empty States
- [ ] Empty table tampil baik
- [ ] Empty list dengan icon dan message
- [ ] Call-to-action jelas

### Error States
- [ ] Error messages readable
- [ ] Error styling konsisten
- [ ] Retry button berfungsi

### Loading States
- [ ] Spinner/skeleton terlihat
- [ ] Loading tidak blocking
- [ ] Timeout handled

### Long Content
- [ ] Long text tidak overflow
- [ ] Truncation dengan ellipsis
- [ ] Tooltip (jika ada) berfungsi

## 📝 Notes

### Issues Found
```
[Catat semua issue yang ditemukan di sini]
- Issue 1: ...
- Issue 2: ...
```

### Improvements Needed
```
[Catat improvement yang diperlukan]
- Improvement 1: ...
- Improvement 2: ...
```

## ✅ Final Sign-off

- [ ] All visual tests passed
- [ ] All functional tests passed
- [ ] All responsive tests passed
- [ ] All browser tests passed
- [ ] All accessibility tests passed
- [ ] All performance tests passed
- [ ] All specific pages tested
- [ ] All edge cases handled

**Tested by**: _______________
**Date**: _______________
**Status**: ⬜ Pass / ⬜ Fail
**Notes**: _______________
