# Requirements Document: NAS Rebuild

## Introduction

This document specifies the requirements for rebuilding the Marine Engineering Project Management System (NAS) from scratch. The current application has experienced deployment failures and needs to be rebuilt with a modern, deployment-friendly technology stack while maintaining compatibility with the existing Neon PostgreSQL database.

The system manages the complete lifecycle of marine engineering projects, from initial customer quotations through project execution, material procurement, expense tracking, invoicing, and final reporting.

## Glossary

- **System**: The NAS Marine Engineering Project Management web application
- **User**: Any authenticated person using the system (leader, sales, accounting, or engineer role)
- **Customer**: A client company or individual requesting marine engineering services
- **Quotation**: A formal price estimate for proposed work, including labor and materials
- **Project**: An approved quotation that has been converted to active work
- **Material_Request**: A formal request by an engineer for materials needed for a project
- **Invoice**: A billing document sent to customers for completed work or milestones
- **Project_Report**: A completion document summarizing work performed and materials used
- **Neon_Database**: The existing PostgreSQL database hosted on Neon (project: NAS, id: misty-wave-96189879)
- **Shadcn_UI**: The UI component library and design system to be used for the frontend
- **Vercel**: The target deployment platform for the application

## Requirements

### Requirement 1: System Architecture and Deployment

**User Story:** As a system administrator, I want the application to deploy successfully to Vercel without complex configuration, so that I can maintain and update the system reliably.

#### Acceptance Criteria

1. THE System SHALL be built using Next.js App Router with API routes or Remix framework
2. WHEN the application is deployed to Vercel, THE System SHALL deploy successfully on the first attempt without build errors
3. THE System SHALL require only standard environment variables (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL)
4. THE System SHALL NOT require custom server configuration or complex build scripts
5. THE System SHALL be created in a new "nas" folder at the workspace root, separate from the "apps" folder

### Requirement 2: Database Integration

**User Story:** As a developer, I want to connect to the existing Neon PostgreSQL database, so that all existing data is preserved and accessible.

#### Acceptance Criteria

1. THE System SHALL connect to the existing Neon PostgreSQL database using the provided connection string
2. THE System SHALL work with the existing 17-table schema without requiring schema modifications
3. WHEN performing database operations, THE System SHALL use connection pooling for optimal performance
4. THE System SHALL handle database connection errors gracefully and provide meaningful error messages
5. THE System SHALL support all existing tables: auth_users, auth_accounts, auth_sessions, auth_verification_token, customers, materials, quotations, quotation_line_items, quotation_scope_work, projects, material_requests, material_request_items, project_costs, invoices, invoice_line_items, project_reports, migrations

### Requirement 3: Authentication and Authorization

**User Story:** As a user, I want to log in securely with my credentials, so that I can access the system based on my role.

#### Acceptance Criteria

1. THE System SHALL implement authentication using NextAuth.js or equivalent
2. WHEN a user provides valid credentials, THE System SHALL authenticate against the auth_users table
3. THE System SHALL support four user roles: leader, sales, accounting, and engineer
4. WHEN a user logs in, THE System SHALL create a session record in the auth_sessions table
5. THE System SHALL maintain user sessions securely with appropriate timeout periods
6. WHEN a user logs out, THE System SHALL invalidate the session and clear authentication tokens
7. THE System SHALL restrict access to features based on user roles

### Requirement 4: User Interface and Design System

**User Story:** As a user, I want a modern, professional interface, so that I can work efficiently and enjoy using the system.

#### Acceptance Criteria

1. THE System SHALL use shadcn/ui components initialized with the specified custom template
2. THE System SHALL implement an indigo theme with gray base colors and Tabler icons
3. THE System SHALL support RTL (right-to-left) layout
4. THE System SHALL be responsive across mobile, tablet, and desktop screen sizes
5. WHEN forms are submitted with invalid data, THE System SHALL display clear validation error messages
6. THE System SHALL display loading states during asynchronous operations
7. THE System SHALL show toast notifications for success and error messages
8. THE System SHALL use modal dialogs for create and edit operations

### Requirement 5: Customer Management

**User Story:** As a sales representative, I want to manage customer information, so that I can maintain accurate contact details and company records.

#### Acceptance Criteria

1. THE System SHALL display a paginated list of all customers from the customers table
2. WHEN a user searches for customers, THE System SHALL filter results by company name, contact name, email, or phone
3. WHEN a user creates a new customer, THE System SHALL validate required fields (company_name, contact_name, email, phone) and save to the database
4. WHEN a user edits a customer, THE System SHALL update the record in the customers table
5. WHEN a user deletes a customer, THE System SHALL remove the record if no related quotations or projects exist
6. THE System SHALL display customer details including company_name, contact_name, email, phone, and address

### Requirement 6: Materials Catalog Management

**User Story:** As an engineer, I want to manage the materials catalog, so that I can maintain accurate pricing and supplier information.

#### Acceptance Criteria

1. THE System SHALL display a paginated list of all materials from the materials table
2. WHEN a user searches for materials, THE System SHALL filter results by name, part_number, or supplier
3. WHEN a user filters by category, THE System SHALL display only materials matching that category
4. WHEN a user creates a new material, THE System SHALL validate required fields (name, category, unit_type, unit_cost) and save to the database
5. WHEN a user edits a material, THE System SHALL update the record in the materials table
6. WHEN a user deletes a material, THE System SHALL remove the record if no related quotations or material requests exist
7. THE System SHALL display material details including name, description, category, unit_type, unit_cost, supplier, and part_number

### Requirement 7: Quotation Management

**User Story:** As a sales representative, I want to create and manage quotations, so that I can provide accurate price estimates to customers.

#### Acceptance Criteria

1. THE System SHALL allow users to create quotations with customer selection, title, description, labor hours, and labor rate
2. WHEN a user adds line items to a quotation, THE System SHALL save them to the quotation_line_items table
3. WHEN a user adds scope of work items, THE System SHALL save them to the quotation_scope_work table with step numbers
4. WHEN quotation data changes, THE System SHALL automatically calculate materials_cost, labor_cost, and total_cost
5. THE System SHALL support quotation status workflow: draft → sent → approved → rejected
6. WHEN a user generates a PDF quotation, THE System SHALL include all line items, scope of work, and cost calculations
7. WHEN a user converts an approved quotation to a project, THE System SHALL create a new project record linked to the quotation
8. THE System SHALL display a paginated list of quotations with search and filter capabilities

### Requirement 8: Project Management

**User Story:** As a project leader, I want to manage projects, so that I can track progress and assign engineers.

#### Acceptance Criteria

1. THE System SHALL allow users to create projects either from approved quotations or as standalone projects
2. WHEN a user creates a project, THE System SHALL generate a unique project_number and save to the projects table
3. WHEN a user assigns an engineer to a project, THE System SHALL update the assigned_engineer field
4. THE System SHALL support project status workflow: planning → in_progress → completed
5. WHEN a user views a project, THE System SHALL display related quotation, customer, costs, material requests, and invoices
6. THE System SHALL track start_date and expected_completion dates
7. THE System SHALL display a paginated list of projects with search and filter capabilities by status and assigned engineer

### Requirement 9: Material Request Management

**User Story:** As an engineer, I want to create material requests for projects, so that I can obtain necessary materials for my work.

#### Acceptance Criteria

1. WHEN an engineer creates a material request, THE System SHALL require project_id, title, request_type, and urgency
2. WHEN a user adds items to a material request, THE System SHALL save them to the material_request_items table
3. WHEN material request items are added, THE System SHALL calculate estimated_total_cost automatically
4. THE System SHALL support material request status workflow: draft → submitted → under_review → approved → rejected
5. WHEN a material request is submitted, THE System SHALL prevent further editing unless returned to draft
6. THE System SHALL display a paginated list of material requests with filtering by project, status, and urgency
7. WHEN a leader approves a material request, THE System SHALL update the status to approved

### Requirement 10: Expense Tracking

**User Story:** As an accountant, I want to track project costs, so that I can monitor budgets and profitability.

#### Acceptance Criteria

1. THE System SHALL allow users to record project costs with cost_type (labor, materials, equipment, other)
2. WHEN a user creates a cost entry, THE System SHALL require project_id, cost_type, description, and total_cost
3. WHEN a cost entry is linked to a material, THE System SHALL record material_id, quantity, and unit_cost
4. THE System SHALL track vendor information for material purchases
5. THE System SHALL display total costs per project grouped by cost_type
6. THE System SHALL allow filtering costs by project, cost_type, and date range
7. WHEN a user views a project, THE System SHALL display all related costs with running totals

### Requirement 11: Invoice Management

**User Story:** As an accountant, I want to create and manage invoices, so that I can bill customers for completed work.

#### Acceptance Criteria

1. THE System SHALL allow users to create invoices linked to projects and customers
2. WHEN a user creates an invoice, THE System SHALL generate a unique invoice_number
3. WHEN a user adds line items to an invoice, THE System SHALL save them to the invoice_line_items table
4. WHEN invoice line items are added or modified, THE System SHALL calculate total_amount automatically
5. THE System SHALL support invoice status workflow: draft → sent → partial → paid
6. WHEN a user records a payment, THE System SHALL update amount_paid and status
7. WHEN a user generates a PDF invoice, THE System SHALL include all line items, amounts, and payment terms
8. THE System SHALL display a paginated list of invoices with filtering by customer, project, and status

### Requirement 12: Project Reporting

**User Story:** As an engineer, I want to create project completion reports, so that I can document work performed and obtain customer approval.

#### Acceptance Criteria

1. WHEN an engineer completes a project, THE System SHALL allow creation of a project report
2. THE System SHALL require work_summary and materials_used fields in the report
3. THE System SHALL allow uploading photos or documents related to the completed work
4. THE System SHALL support customer signature capture and store the signature URL
5. THE System SHALL support report status: draft → submitted → approved
6. WHEN a report is approved, THE System SHALL update the related project status to completed
7. THE System SHALL display all reports for a project with their approval status

### Requirement 13: Dashboard and Overview

**User Story:** As a user, I want to see an overview dashboard, so that I can quickly understand system status and recent activities.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL display a dashboard with key statistics
2. THE System SHALL display counts of active projects, pending quotations, and pending material requests
3. THE System SHALL show recent activities across quotations, projects, and invoices
4. THE System SHALL provide quick action buttons for common tasks based on user role
5. WHEN a leader views the dashboard, THE System SHALL display items requiring approval
6. THE System SHALL display statistics relevant to the user's role (sales sees quotations, engineers see projects, etc.)

### Requirement 14: Data Validation and Error Handling

**User Story:** As a user, I want clear error messages and validation, so that I can correct mistakes and understand what went wrong.

#### Acceptance Criteria

1. WHEN a user submits a form with missing required fields, THE System SHALL display field-specific error messages
2. WHEN a database operation fails, THE System SHALL display a user-friendly error message and log technical details
3. WHEN a user attempts an unauthorized action, THE System SHALL display an access denied message
4. THE System SHALL validate email addresses, phone numbers, and numeric fields before saving
5. WHEN a user attempts to delete a record with dependencies, THE System SHALL prevent deletion and explain the constraint
6. THE System SHALL validate date ranges (start_date before expected_completion, issue_date before due_date)

### Requirement 15: Data Tables and Pagination

**User Story:** As a user, I want to efficiently browse large datasets, so that I can find information quickly.

#### Acceptance Criteria

1. THE System SHALL display data tables with sorting capabilities on all columns
2. WHEN a user clicks a column header, THE System SHALL sort the table by that column
3. THE System SHALL paginate lists with configurable page sizes (10, 25, 50, 100 items)
4. THE System SHALL display pagination controls showing current page and total pages
5. WHEN a user applies filters, THE System SHALL maintain pagination and update page counts
6. THE System SHALL display loading indicators while fetching paginated data
7. THE System SHALL preserve sort order and filters when navigating between pages

