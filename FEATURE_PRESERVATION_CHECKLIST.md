# Feature Preservation Checklist

Checklist untuk memastikan semua fitur NAS existing tetap berfungsi setelah integrasi dengan TailAdmin template.

---

## 🔐 Authentication & Authorization

### NextAuth.js Integration
- [ ] **Login functionality**
  - [ ] Email/password authentication
  - [ ] Session management (30-day expiry)
  - [ ] JWT token generation
  - [ ] Argon2 password hashing
  - [ ] Remember me functionality

- [ ] **User roles**
  - [ ] Leader role (full access)
  - [ ] Sales role (customers, quotations, projects)
  - [ ] Accounting role (invoices, financial)
  - [ ] Engineer role (projects, material requests, reports)

- [ ] **Protected routes**
  - [ ] Middleware authentication check
  - [ ] Redirect to login if not authenticated
  - [ ] Role-based page access
  - [ ] API route protection

- [ ] **Session handling**
  - [ ] Session persistence across page reloads
  - [ ] Logout functionality
  - [ ] Session expiry handling
  - [ ] Refresh token mechanism

**Files to Preserve**:
- `src/lib/auth.ts` - NextAuth configuration
- `src/middleware.ts` - Route protection
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API

---

## 💾 Database Integration

### Neon PostgreSQL
- [ ] **Connection**
  - [ ] Database connection pooling
  - [ ] Environment variable configuration
  - [ ] SSL connection
  - [ ] Error handling

- [ ] **Query execution**
  - [ ] Parameterized queries (SQL template literals)
  - [ ] Transaction support
  - [ ] Error handling
  - [ ] Connection retry logic

- [ ] **Schema integrity**
  - [ ] All tables accessible
  - [ ] Foreign key constraints working
  - [ ] Indexes functioning
  - [ ] Data types correct

**Files to Preserve**:
- `src/lib/db.ts` - Database connection
- `.env.local` - DATABASE_URL

---

## 👥 Customer Management

### CRUD Operations
- [ ] **Create customer**
  - [ ] Form validation (Zod)
  - [ ] Required fields check
  - [ ] Email format validation
  - [ ] Phone number validation
  - [ ] Success notification

- [ ] **Read customers**
  - [ ] List all customers
  - [ ] Pagination (10, 25, 50, 100 per page)
  - [ ] Search by name, email, phone
  - [ ] Filter by status (active/inactive)
  - [ ] Sort by columns

- [ ] **Update customer**
  - [ ] Edit form pre-filled
  - [ ] Validation on update
  - [ ] Optimistic UI update
  - [ ] Success notification

- [ ] **Delete customer**
  - [ ] Confirmation dialog
  - [ ] Cascade delete check
  - [ ] Success notification
  - [ ] Error handling

### UI Components
- [ ] **Table**
  - [ ] Responsive design
  - [ ] Column sorting
  - [ ] Row actions (edit, delete)
  - [ ] Empty state
  - [ ] Loading state

- [ ] **Forms**
  - [ ] Input validation
  - [ ] Error messages
  - [ ] Submit button state
  - [ ] Cancel button
  - [ ] Field focus management

**Files to Preserve**:
- `src/app/(dashboard)/customers/page.tsx`
- `src/app/(dashboard)/customers/[id]/page.tsx`
- `src/components/customers/*`
- `src/app/api/customers/*`

---

## 📦 Materials Management

### CRUD Operations
- [ ] **Create material**
  - [ ] Name, description, unit
  - [ ] Price validation (positive number)
  - [ ] Stock quantity
  - [ ] Supplier information
  - [ ] Category selection

- [ ] **Read materials**
  - [ ] List with pagination
  - [ ] Search by name, description
  - [ ] Filter by category
  - [ ] Sort by price, stock
  - [ ] Low stock indicator

- [ ] **Update material**
  - [ ] Edit form
  - [ ] Price history tracking
  - [ ] Stock adjustment
  - [ ] Supplier update

- [ ] **Delete material**
  - [ ] Check if used in quotations
  - [ ] Confirmation dialog
  - [ ] Soft delete option

### Features
- [ ] **Inventory tracking**
  - [ ] Current stock display
  - [ ] Low stock alerts
  - [ ] Stock history
  - [ ] Reorder level

- [ ] **Pricing**
  - [ ] Base price
  - [ ] Discount support
  - [ ] Price history
  - [ ] Currency formatting (IDR)

**Files to Preserve**:
- `src/app/(dashboard)/materials/page.tsx`
- `src/components/materials/*`
- `src/app/api/materials/*`

---

## 📄 Quotation Management

### Core Features
- [ ] **Create quotation**
  - [ ] Customer selection
  - [ ] Project information
  - [ ] Line items table
  - [ ] Scope of work
  - [ ] Terms & conditions
  - [ ] Validity period

- [ ] **Line items**
  - [ ] Add material
  - [ ] Quantity input
  - [ ] Unit price
  - [ ] Discount
  - [ ] Subtotal calculation
  - [ ] Total calculation
  - [ ] Tax calculation

- [ ] **Scope of work**
  - [ ] Multiple scope items
  - [ ] Description field
  - [ ] Add/remove items
  - [ ] Reorder items

- [ ] **Status management**
  - [ ] Draft
  - [ ] Sent
  - [ ] Approved
  - [ ] Rejected
  - [ ] Converted to project

### Export Features
- [ ] **PDF export**
  - [ ] Company logo
  - [ ] Customer details
  - [ ] Line items table
  - [ ] Scope of work
  - [ ] Terms & conditions
  - [ ] Signature section
  - [ ] Download functionality

- [ ] **DOCX export**
  - [ ] Same content as PDF
  - [ ] Editable format
  - [ ] Proper formatting
  - [ ] Download functionality

### Calculations
- [ ] **Automatic calculations**
  - [ ] Line item subtotal
  - [ ] Discount application
  - [ ] Tax calculation (11% PPN)
  - [ ] Grand total
  - [ ] Currency formatting

**Files to Preserve**:
- `src/app/(dashboard)/quotations/*`
- `src/components/quotations/*`
- `src/app/api/quotations/*`
- `src/lib/pdf/quotation-template.tsx`

---

## 🏗️ Project Management

### Core Features
- [ ] **Create project**
  - [ ] From quotation conversion
  - [ ] Manual creation
  - [ ] Project details
  - [ ] Timeline setup
  - [ ] Team assignment

- [ ] **Project tracking**
  - [ ] Status updates (planning, in-progress, completed)
  - [ ] Progress percentage
  - [ ] Timeline view
  - [ ] Milestone tracking
  - [ ] Task management

- [ ] **Team management**
  - [ ] Assign engineers
  - [ ] Role assignment
  - [ ] Workload tracking
  - [ ] Notification system

### Timeline Component
- [ ] **Visual timeline**
  - [ ] Start/end dates
  - [ ] Milestones
  - [ ] Progress indicator
  - [ ] Gantt-style view
  - [ ] Responsive design

**Files to Preserve**:
- `src/app/(dashboard)/projects/*`
- `src/components/projects/*`
- `src/app/api/projects/*`

---

## 📋 Material Request Management

### Workflow
- [ ] **Create request**
  - [ ] Project selection
  - [ ] Material selection
  - [ ] Quantity input
  - [ ] Justification field
  - [ ] Priority level
  - [ ] Delivery date

- [ ] **Request items**
  - [ ] Multiple materials
  - [ ] Quantity per item
  - [ ] Notes per item
  - [ ] Remove items
  - [ ] Total calculation

- [ ] **Approval workflow**
  - [ ] Pending status
  - [ ] Approve button (Leader/Accounting)
  - [ ] Reject button with reason
  - [ ] Status history
  - [ ] Notification to requester

### Status Management
- [ ] **Status transitions**
  - [ ] Draft → Pending
  - [ ] Pending → Approved
  - [ ] Pending → Rejected
  - [ ] Approved → Fulfilled
  - [ ] Status change logging

**Files to Preserve**:
- `src/app/(dashboard)/material-requests/*`
- `src/components/material-requests/*`
- `src/app/api/material-requests/*`

---

## 🧾 Invoice Management

### Core Features
- [ ] **Create invoice**
  - [ ] From project
  - [ ] Customer selection
  - [ ] Invoice number generation
  - [ ] Due date calculation
  - [ ] Line items
  - [ ] Tax calculation

- [ ] **Line items**
  - [ ] Description
  - [ ] Quantity
  - [ ] Unit price
  - [ ] Amount
  - [ ] Total calculation

- [ ] **Payment tracking**
  - [ ] Payment amount
  - [ ] Payment date
  - [ ] Payment method
  - [ ] Payment notes
  - [ ] Outstanding balance
  - [ ] Payment history

### Status Management
- [ ] **Invoice status**
  - [ ] Draft
  - [ ] Sent
  - [ ] Paid
  - [ ] Partially paid
  - [ ] Overdue
  - [ ] Cancelled

### Export
- [ ] **PDF generation**
  - [ ] Invoice template
  - [ ] Company details
  - [ ] Customer details
  - [ ] Line items table
  - [ ] Payment terms
  - [ ] Bank details
  - [ ] Download functionality

**Files to Preserve**:
- `src/app/(dashboard)/invoices/*`
- `src/components/invoices/*`
- `src/app/api/invoices/*`
- `src/lib/pdf/invoice-template.tsx`

---

## 📊 Project Reports

### Core Features
- [ ] **Create report**
  - [ ] Project selection
  - [ ] Report type
  - [ ] Report date
  - [ ] Description
  - [ ] Findings
  - [ ] Recommendations

- [ ] **File upload**
  - [ ] Multiple files
  - [ ] Image support
  - [ ] PDF support
  - [ ] File size limit
  - [ ] Preview functionality
  - [ ] Delete uploaded files

- [ ] **Signature capture**
  - [ ] Canvas drawing
  - [ ] Clear signature
  - [ ] Save signature
  - [ ] Display saved signature
  - [ ] Signature date/time

- [ ] **Approval workflow**
  - [ ] Submit for approval
  - [ ] Approve button (Leader)
  - [ ] Reject with comments
  - [ ] Status tracking
  - [ ] Notification system

**Files to Preserve**:
- `src/app/(dashboard)/reports/*`
- `src/components/reports/*`
- `src/app/api/reports/*`

---

## 📈 Dashboard Analytics

### Metrics
- [ ] **Statistics cards**
  - [ ] Total customers
  - [ ] Active projects
  - [ ] Pending quotations
  - [ ] Outstanding invoices
  - [ ] Monthly revenue
  - [ ] Trend indicators

- [ ] **Charts**
  - [ ] Revenue chart (line/bar)
  - [ ] Project status distribution (pie)
  - [ ] Monthly comparison
  - [ ] Year-over-year growth

- [ ] **Recent activities**
  - [ ] Latest quotations
  - [ ] Recent projects
  - [ ] Pending approvals
  - [ ] Overdue invoices

### Role-based Dashboard
- [ ] **Leader view**
  - [ ] All metrics
  - [ ] Financial overview
  - [ ] Team performance
  - [ ] Pending approvals

- [ ] **Sales view**
  - [ ] Quotation metrics
  - [ ] Customer stats
  - [ ] Conversion rate
  - [ ] Pipeline view

- [ ] **Accounting view**
  - [ ] Financial metrics
  - [ ] Invoice status
  - [ ] Payment tracking
  - [ ] Revenue reports

- [ ] **Engineer view**
  - [ ] Assigned projects
  - [ ] Material requests
  - [ ] Task completion
  - [ ] Work hours

**Files to Preserve**:
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/api/dashboard/*`

---

## 🎨 UI/UX Features

### Responsive Design
- [ ] **Mobile (< 768px)**
  - [ ] Hamburger menu
  - [ ] Stacked layout
  - [ ] Touch-friendly buttons
  - [ ] Readable text size

- [ ] **Tablet (768px - 1024px)**
  - [ ] Sidebar collapse
  - [ ] Grid layout
  - [ ] Optimized spacing

- [ ] **Desktop (> 1024px)**
  - [ ] Full sidebar
  - [ ] Multi-column layout
  - [ ] Hover effects
  - [ ] Keyboard shortcuts

### Loading States
- [ ] **Skeleton loaders**
  - [ ] Table skeleton
  - [ ] Card skeleton
  - [ ] Form skeleton
  - [ ] Detail page skeleton

- [ ] **Spinners**
  - [ ] Button loading state
  - [ ] Page loading
  - [ ] Inline loading
  - [ ] Overlay loading

### Error Handling
- [ ] **Error boundaries**
  - [ ] Component error catch
  - [ ] Fallback UI
  - [ ] Error reporting
  - [ ] Retry mechanism

- [ ] **Toast notifications**
  - [ ] Success messages
  - [ ] Error messages
  - [ ] Warning messages
  - [ ] Info messages
  - [ ] Auto-dismiss
  - [ ] Manual dismiss

### Empty States
- [ ] **No data states**
  - [ ] Empty table
  - [ ] No search results
  - [ ] No items in list
  - [ ] Call-to-action button

**Files to Preserve**:
- `src/components/shared/*`
- `src/components/error-boundary.tsx`
- `src/components/ui/toast.tsx`

---

## 🌐 Internationalization

### Indonesian Language
- [ ] **UI text**
  - [ ] Button labels
  - [ ] Form labels
  - [ ] Error messages
  - [ ] Success messages
  - [ ] Navigation menu

- [ ] **Date formatting**
  - [ ] Indonesian locale
  - [ ] DD/MM/YYYY format
  - [ ] Relative dates (hari ini, kemarin)

- [ ] **Currency**
  - [ ] IDR (Rupiah)
  - [ ] Thousand separator (.)
  - [ ] Decimal separator (,)
  - [ ] Currency symbol (Rp)

**Files to Check**:
- All component files for hardcoded text
- Date formatting utilities
- Currency formatting utilities

---

## 🔒 Security Features

### Input Validation
- [ ] **Client-side**
  - [ ] Zod schema validation
  - [ ] Form field validation
  - [ ] Real-time error display
  - [ ] Submit button disable

- [ ] **Server-side**
  - [ ] API route validation
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection

### Authentication Security
- [ ] **Password handling**
  - [ ] Argon2 hashing
  - [ ] Salt generation
  - [ ] Hash verification
  - [ ] Password strength check

- [ ] **Session security**
  - [ ] HTTP-only cookies
  - [ ] Secure flag (HTTPS)
  - [ ] SameSite attribute
  - [ ] Session expiry

### API Security
- [ ] **Authorization**
  - [ ] JWT token verification
  - [ ] Role-based access
  - [ ] Resource ownership check
  - [ ] Rate limiting

**Files to Preserve**:
- `src/lib/validations.ts`
- `src/lib/auth.ts`
- `src/middleware.ts`

---

## 📱 Progressive Web App (Optional)

If NAS has PWA features:
- [ ] **Manifest**
  - [ ] App name
  - [ ] Icons
  - [ ] Theme color
  - [ ] Start URL

- [ ] **Service Worker**
  - [ ] Offline support
  - [ ] Cache strategy
  - [ ] Background sync

---

## ✅ Testing Checklist

### Manual Testing
- [ ] Test all CRUD operations
- [ ] Test authentication flow
- [ ] Test role-based access
- [ ] Test form validations
- [ ] Test file uploads
- [ ] Test PDF/DOCX exports
- [ ] Test responsive design
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test empty states

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Performance Testing
- [ ] Page load time < 3s
- [ ] API response time < 1s
- [ ] No memory leaks
- [ ] No console errors
- [ ] Lighthouse score > 90

---

## 📝 Documentation Updates

- [ ] Update README.md
- [ ] Update API documentation
- [ ] Update deployment guide
- [ ] Update user guide
- [ ] Update developer guide
- [ ] Update changelog

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Build successful
- [ ] Environment variables set
- [ ] Database backup created
- [ ] Rollback plan ready

### Deployment
- [ ] Deploy to staging
- [ ] Smoke test staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-deployment
- [ ] Verify all features working
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Document issues

---

**Status**: 🟡 In Progress
**Last Updated**: February 2026
**Completion**: 0% (Ready to start)

---

## Notes

- Check off items as you complete them
- Document any issues or deviations
- Update this checklist as needed
- Keep original NAS files as reference
- Test thoroughly before marking complete
