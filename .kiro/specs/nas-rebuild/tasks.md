# Implementation Plan: NAS Rebuild

## Overview

This implementation plan breaks down the NAS rebuild into incremental, testable steps. Each task builds on previous work, starting with foundational setup and progressing through core features. The approach prioritizes getting a working deployment early, then adding features incrementally.

## Tasks

- [x] 1. Project initialization and deployment setup
  - Initialize Next.js 14+ project in "nas" folder with TypeScript and App Router
  - Initialize shadcn/ui with custom template: `npx shadcn@latest create --rtl --preset "https://ui.shadcn.com/init?base=radix&style=mira&baseColor=gray&theme=indigo&iconLibrary=tabler&font=jetbrains-mono&menuAccent=subtle&menuColor=inverted&radius=medium&template=start&rtl=true" --template start`
  - Configure Tailwind CSS with indigo theme and gray base colors
  - Set up environment variables (.env.local template with DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL)
  - Create vercel.json with minimal configuration
  - Test deployment to Vercel (should succeed on first attempt)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

- [x] 2. Database connection and authentication
  - [x] 2.1 Set up Neon PostgreSQL connection
    - Install @neondatabase/serverless package
    - Create src/lib/db.ts with connection pooling
    - Create test API route to verify database connectivity
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.2 Implement NextAuth.js authentication
    - Install next-auth package
    - Create src/lib/auth.ts with credentials provider
    - Configure authentication against auth_users table
    - Create login page at src/app/(auth)/login/page.tsx
    - Implement session management with auth_sessions table
    - Add logout functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 2.3 Write unit tests for authentication
    - Test valid credential authentication
    - Test invalid credential rejection
    - Test session creation
    - Test logout session invalidation
    - _Requirements: 3.2, 3.4, 3.6_
  
  - [ ]* 2.4 Write property test for authorization
    - **Property 10: Authorization Enforcement**
    - **Validates: Requirements 3.7, 14.3**
    - Test that protected routes deny access to unauthorized roles
    - _Requirements: 3.7_

- [x] 3. Core UI components and layout
  - [x] 3.1 Create shared layout components
    - Create src/components/layout/Sidebar.tsx with navigation
    - Create src/components/layout/Header.tsx with user menu
    - Create src/app/(dashboard)/layout.tsx with sidebar and header
    - Implement role-based navigation menu items
    - _Requirements: 4.1, 4.8_
  
  - [x] 3.2 Create reusable data table component
    - Create src/components/shared/DataTable.tsx with sorting, search, and pagination
    - Add loading spinner component
    - Add search bar component
    - Add pagination controls component
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ]* 3.3 Write property tests for data table
    - **Property 13: Table Sorting**
    - **Validates: Requirements 15.1**
    - **Property 14: Pagination with Filters**
    - **Validates: Requirements 15.5, 15.7**
    - Test sorting functionality across different data types
    - Test pagination preserves filters and sort order
    - _Requirements: 15.1, 15.5, 15.7_
  
  - [x] 3.4 Create form validation utilities
    - Create src/lib/validations.ts with Zod schemas
    - Implement customerSchema, materialSchema, quotationSchema, projectSchema
    - Add date range validation helpers
    - _Requirements: 14.4, 14.6_
  
  - [ ]* 3.5 Write property tests for validation
    - **Property 2: Form Validation**
    - **Validates: Requirements 4.5, 14.1, 14.4**
    - **Property 12: Date Range Validation**
    - **Validates: Requirements 14.6**
    - Test validation rejects invalid emails, phones, numbers
    - Test date range validation
    - _Requirements: 4.5, 14.1, 14.4, 14.6_

- [x] 4. Checkpoint - Verify foundation
  - Ensure all tests pass, verify Vercel deployment works, confirm database connection and authentication functional

- [x] 5. Customer management feature
  - [x] 5.1 Create customer API routes
    - Create src/app/api/customers/route.ts with GET (list with pagination/search) and POST (create)
    - Create src/app/api/customers/[id]/route.ts with GET (single), PUT (update), DELETE
    - Implement search filtering by company_name, contact_name, email, phone
    - Add referential integrity check on delete
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.2 Create customer UI components
    - Create src/components/customers/CustomerTable.tsx
    - Create src/components/customers/CustomerForm.tsx with validation
    - Create src/components/customers/CustomerModal.tsx for create/edit
    - _Requirements: 5.1, 5.3, 5.4, 5.6_
  
  - [x] 5.3 Create customer pages
    - Create src/app/(dashboard)/customers/page.tsx with list and search
    - Create src/app/(dashboard)/customers/[id]/page.tsx for customer details
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [ ]* 5.4 Write unit tests for customer API
    - Test customer creation with valid data
    - Test customer update
    - Test customer deletion with referential integrity
    - Test search functionality
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 5.5 Write property tests for customer features
    - **Property 5: Search Functionality**
    - **Validates: Requirements 5.2, 6.2**
    - **Property 11: Referential Integrity on Delete**
    - **Validates: Requirements 5.5, 6.6, 14.5**
    - Test search returns matching results
    - Test delete prevention with dependencies
    - _Requirements: 5.2, 5.5_

- [x] 6. Materials catalog feature
  - [x] 6.1 Create materials API routes
    - Create src/app/api/materials/route.ts with GET (list with pagination/search/filter) and POST
    - Create src/app/api/materials/[id]/route.ts with GET, PUT, DELETE
    - Implement search by name, part_number, supplier
    - Implement category filtering
    - Add referential integrity check on delete
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 6.2 Create materials UI components
    - Create src/components/materials/MaterialTable.tsx with category filter
    - Create src/components/materials/MaterialForm.tsx
    - Create src/components/materials/MaterialModal.tsx
    - _Requirements: 6.1, 6.4, 6.5, 6.7_
  
  - [x] 6.3 Create materials page
    - Create src/app/(dashboard)/materials/page.tsx with list, search, and category filter
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 6.4 Write unit tests for materials API
    - Test material creation
    - Test category filtering
    - Test search functionality
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ]* 6.5 Write property test for category filtering
    - **Property 6: Category Filtering**
    - **Validates: Requirements 6.3**
    - Test all filtered results match the category
    - _Requirements: 6.3_

- [x] 7. Dashboard feature
  - [x] 7.1 Create dashboard API route
    - Create src/app/api/dashboard/route.ts
    - Implement statistics queries (active projects count, pending quotations, pending material requests)
    - Implement recent activities query
    - Add role-based filtering for approval items
    - _Requirements: 13.1, 13.2, 13.3, 13.5_
  
  - [x] 7.2 Create dashboard page
    - Create src/app/(dashboard)/dashboard/page.tsx
    - Display key statistics cards
    - Display recent activities list
    - Add role-based quick action buttons
    - Display approval queue for leaders
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ]* 7.3 Write property test for dashboard statistics
    - **Property 7: Cost Calculation Accuracy** (dashboard counts portion)
    - **Validates: Requirements 13.2**
    - Test dashboard counts match actual database records
    - _Requirements: 13.2_

- [x] 8. Checkpoint - Verify core features
  - Ensure all tests pass, verify customer and materials CRUD works, confirm dashboard displays correctly

- [x] 9. Quotation management feature
  - [x] 9.1 Create quotation API routes
    - Create src/app/api/quotations/route.ts with GET (list) and POST (create)
    - Create src/app/api/quotations/[id]/route.ts with GET, PUT, DELETE
    - Create src/app/api/quotations/[id]/line-items/route.ts for line items
    - Create src/app/api/quotations/[id]/scope-work/route.ts for scope of work
    - Implement automatic cost calculations (materials_cost, labor_cost, total_cost)
    - Implement status workflow validation (draft → sent → approved/rejected)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 9.2 Create quotation UI components
    - Create src/components/quotations/QuotationForm.tsx
    - Create src/components/quotations/LineItemsTable.tsx with add/edit/delete
    - Create src/components/quotations/ScopeOfWorkForm.tsx with step numbers
    - Display calculated totals in real-time
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 9.3 Create quotation pages
    - Create src/app/(dashboard)/quotations/page.tsx with list and filters
    - Create src/app/(dashboard)/quotations/new/page.tsx for creation
    - Create src/app/(dashboard)/quotations/[id]/page.tsx for details and editing
    - _Requirements: 7.1, 7.8_
  
  - [ ]* 9.4 Write unit tests for quotation API
    - Test quotation creation
    - Test line item addition
    - Test scope of work addition
    - Test status transitions
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [ ]* 9.5 Write property tests for quotation features
    - **Property 7: Cost Calculation Accuracy** (quotation portion)
    - **Validates: Requirements 7.4**
    - **Property 8: Status Workflow Validity** (quotation portion)
    - **Validates: Requirements 7.5**
    - Test cost calculations are accurate
    - Test only valid status transitions are allowed
    - _Requirements: 7.4, 7.5_

- [x] 10. Project management feature
  - [x] 10.1 Create project API routes
    - Create src/app/api/projects/route.ts with GET (list with filters) and POST (create)
    - Create src/app/api/projects/[id]/route.ts with GET, PUT
    - Implement project_number generation (unique)
    - Implement status workflow validation (planning → in_progress → completed)
    - Add endpoint to fetch related data (quotation, customer, costs, material requests, invoices)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 10.2 Create quotation-to-project conversion
    - Create src/app/api/quotations/[id]/convert-to-project/route.ts
    - Validate quotation is approved before conversion
    - Create project record linked to quotation
    - _Requirements: 7.7, 8.1_
  
  - [x] 10.3 Create project UI components
    - Create src/components/projects/ProjectCard.tsx
    - Create src/components/projects/ProjectTimeline.tsx
    - Create project form component with engineer assignment
    - _Requirements: 8.3, 8.5, 8.6_
  
  - [x] 10.4 Create project pages
    - Create src/app/(dashboard)/projects/page.tsx with list and filters
    - Create src/app/(dashboard)/projects/[id]/page.tsx with all related data
    - Add convert-to-project button on quotation detail page
    - _Requirements: 8.1, 8.5, 8.7_
  
  - [ ]* 10.5 Write unit tests for project API
    - Test project creation
    - Test quotation-to-project conversion
    - Test engineer assignment
    - Test status transitions
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 10.6 Write property tests for project features
    - **Property 9: Unique Identifier Generation** (project portion)
    - **Validates: Requirements 8.2**
    - **Property 8: Status Workflow Validity** (project portion)
    - **Validates: Requirements 8.4**
    - Test project numbers are unique
    - Test only valid status transitions are allowed
    - _Requirements: 8.2, 8.4_

- [x] 11. Material request feature
  - [x] 11.1 Create material request API routes
    - Create src/app/api/material-requests/route.ts with GET (list with filters) and POST
    - Create src/app/api/material-requests/[id]/route.ts with GET, PUT
    - Create src/app/api/material-requests/[id]/items/route.ts for request items
    - Create src/app/api/material-requests/[id]/approve/route.ts for approval (leader only)
    - Implement automatic estimated_total_cost calculation
    - Implement status workflow validation
    - Prevent editing when status is not draft
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_
  
  - [x] 11.2 Create material request UI components
    - Create material request form with project selection
    - Create request items table with add/edit/delete
    - Display calculated estimated total
    - Add approval button for leaders
    - _Requirements: 9.1, 9.2, 9.3, 9.7_
  
  - [x] 11.3 Create material request pages
    - Create src/app/(dashboard)/material-requests/page.tsx with list and filters
    - Create src/app/(dashboard)/material-requests/new/page.tsx for creation
    - Create src/app/(dashboard)/material-requests/[id]/page.tsx for details
    - _Requirements: 9.1, 9.6_
  
  - [ ]* 11.4 Write unit tests for material request API
    - Test material request creation
    - Test item addition
    - Test approval workflow
    - Test edit prevention when submitted
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.7_
  
  - [ ]* 11.5 Write property tests for material request features
    - **Property 7: Cost Calculation Accuracy** (material request portion)
    - **Validates: Requirements 9.3**
    - **Property 8: Status Workflow Validity** (material request portion)
    - **Validates: Requirements 9.4**
    - Test estimated total calculation
    - Test status workflow validity
    - _Requirements: 9.3, 9.4_

- [x] 12. Checkpoint - Verify project workflow
  - Ensure all tests pass, verify quotation → project → material request flow works end-to-end

- [x] 13. Expense tracking feature
  - [x] 13.1 Create project costs API routes
    - Create src/app/api/costs/route.ts with GET (list with filters) and POST
    - Create src/app/api/costs/[id]/route.ts with GET, PUT, DELETE
    - Implement filtering by project, cost_type, date range
    - Implement cost aggregation by cost_type
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_
  
  - [x] 13.2 Create project costs UI components
    - Create cost entry form with cost_type selection
    - Create costs table with grouping by cost_type
    - Display running totals
    - Add material linking functionality
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.7_
  
  - [x] 13.3 Add costs section to project detail page
    - Display all project costs with filters
    - Show total costs grouped by cost_type
    - Add create cost button
    - _Requirements: 10.5, 10.7_
  
  - [ ]* 13.4 Write unit tests for costs API
    - Test cost entry creation
    - Test material-linked costs
    - Test cost filtering
    - _Requirements: 10.1, 10.2, 10.3, 10.6_
  
  - [ ]* 13.5 Write property test for cost aggregation
    - **Property 7: Cost Calculation Accuracy** (project costs portion)
    - **Validates: Requirements 10.5**
    - Test displayed totals equal sum of cost records
    - _Requirements: 10.5_

- [x] 14. Invoice management feature
  - [x] 14.1 Create invoice API routes
    - Create src/app/api/invoices/route.ts with GET (list with filters) and POST
    - Create src/app/api/invoices/[id]/route.ts with GET, PUT
    - Create src/app/api/invoices/[id]/line-items/route.ts for line items
    - Create src/app/api/invoices/[id]/payment/route.ts for recording payments
    - Implement invoice_number generation (unique)
    - Implement automatic total_amount calculation
    - Implement status workflow validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [x] 14.2 Create invoice UI components
    - Create invoice form with project and customer selection
    - Create invoice line items table
    - Display calculated total_amount
    - Add payment recording form
    - _Requirements: 11.1, 11.3, 11.4, 11.6_
  
  - [x] 14.3 Create invoice pages
    - Create src/app/(dashboard)/invoices/page.tsx with list and filters
    - Create src/app/(dashboard)/invoices/new/page.tsx for creation
    - Create src/app/(dashboard)/invoices/[id]/page.tsx for details
    - _Requirements: 11.1, 11.8_
  
  - [ ]* 14.4 Write unit tests for invoice API
    - Test invoice creation
    - Test line item addition
    - Test payment recording
    - Test status transitions
    - _Requirements: 11.1, 11.2, 11.3, 11.6_
  
  - [ ]* 14.5 Write property tests for invoice features
    - **Property 9: Unique Identifier Generation** (invoice portion)
    - **Validates: Requirements 11.2**
    - **Property 7: Cost Calculation Accuracy** (invoice portion)
    - **Validates: Requirements 11.4**
    - **Property 8: Status Workflow Validity** (invoice portion)
    - **Validates: Requirements 11.5**
    - Test invoice numbers are unique
    - Test total calculation accuracy
    - Test status workflow validity
    - _Requirements: 11.2, 11.4, 11.5_

- [x] 15. Project reporting feature
  - [x] 15.1 Create project reports API routes
    - Create src/app/api/reports/route.ts with GET and POST
    - Create src/app/api/reports/[id]/route.ts with GET, PUT
    - Create src/app/api/reports/[id]/approve/route.ts for approval
    - Implement status workflow validation
    - Implement project status update on report approval
    - _Requirements: 12.1, 12.2, 12.5, 12.6_
  
  - [x] 15.2 Create project report UI components
    - Create report form with work_summary and materials_used fields
    - Add file upload component for photos/documents
    - Add signature capture component
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 15.3 Add reports section to project detail page
    - Display all project reports with status
    - Add create report button
    - Add approve button for authorized users
    - _Requirements: 12.1, 12.7_
  
  - [ ]* 15.4 Write unit tests for reports API
    - Test report creation
    - Test file upload
    - Test signature capture
    - Test approval workflow
    - Test project status update on approval
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_
  
  - [ ]* 15.5 Write property test for report workflow
    - **Property 8: Status Workflow Validity** (report portion)
    - **Validates: Requirements 12.5**
    - Test status workflow validity
    - _Requirements: 12.5_

- [x] 16. PDF generation features
  - [x] 16.1 Implement quotation PDF generation
    - Install PDF generation library (e.g., @react-pdf/renderer or puppeteer)
    - Create src/lib/pdf/quotation-template.tsx
    - Create src/app/api/quotations/[id]/pdf/route.ts
    - Include all line items, scope of work, and cost calculations
    - _Requirements: 7.6_
  
  - [x] 16.2 Implement invoice PDF generation
    - Create src/lib/pdf/invoice-template.tsx
    - Create src/app/api/invoices/[id]/pdf/route.ts
    - Include all line items, amounts, and payment terms
    - _Requirements: 11.7_
  
  - [ ]* 16.3 Write unit tests for PDF generation
    - Test quotation PDF includes all required sections
    - Test invoice PDF includes all required sections
    - _Requirements: 7.6, 11.7_

- [x] 17. Error handling and loading states
  - [x] 17.1 Implement global error handling
    - Create error boundary components
    - Implement API error response formatting
    - Add error logging
    - _Requirements: 14.2_
  
  - [x] 17.2 Add loading states to all async operations
    - Add loading spinners to data tables
    - Add loading states to forms
    - Add skeleton loaders to detail pages
    - _Requirements: 4.6, 15.6_
  
  - [x] 17.3 Add toast notifications
    - Configure toast notification system
    - Add success toasts for all create/update/delete operations
    - Add error toasts for all failures
    - _Requirements: 4.7_
  
  - [ ]* 17.4 Write property tests for error handling
    - **Property 1: Database Error Handling**
    - **Validates: Requirements 2.4, 14.2**
    - **Property 3: Loading State Display**
    - **Validates: Requirements 4.6, 15.6**
    - **Property 4: Toast Notifications**
    - **Validates: Requirements 4.7**
    - Test database errors are handled gracefully
    - Test loading states appear during async operations
    - Test toast notifications appear for operations
    - _Requirements: 2.4, 4.6, 4.7, 14.2_

- [x] 18. Final checkpoint and deployment
  - Ensure all tests pass (unit and property tests)
  - Run full manual testing checklist
  - Verify all features work end-to-end
  - Deploy to Vercel production
  - Verify production deployment works correctly
  - Document any environment variables needed
  - Create user documentation for each feature

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a bottom-up approach: foundation → core features → advanced features
- All features should be tested in isolation before integration testing
- Deployment verification should happen early (task 1) and at the end (task 18)
