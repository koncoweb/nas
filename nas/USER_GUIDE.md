# NAS User Guide

**Marine Engineering Project Management System**  
**Version 1.0.0**

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Customer Management](#customer-management)
4. [Materials Catalog](#materials-catalog)
5. [Quotation Management](#quotation-management)
6. [Project Management](#project-management)
7. [Material Requests](#material-requests)
8. [Expense Tracking](#expense-tracking)
9. [Invoice Management](#invoice-management)
10. [Project Reporting](#project-reporting)
11. [User Roles](#user-roles)

---

## Getting Started

### Logging In

1. Navigate to the NAS application URL
2. Enter your email address and password
3. Click "Sign In"
4. You'll be redirected to the dashboard

### Navigation

The system uses a sidebar navigation menu on the left side:
- **Dashboard**: Overview of system activity
- **Customers**: Manage customer information
- **Materials**: Manage materials catalog
- **Quotations**: Create and manage quotations
- **Projects**: Track active projects
- **Material Requests**: Request materials for projects
- **Invoices**: Manage customer invoicing

The header shows:
- Your name and role
- Logout button

---

## Dashboard

The dashboard provides an at-a-glance view of system activity.

### Key Statistics
- **Active Projects**: Number of projects currently in progress
- **Pending Quotations**: Quotations awaiting customer response
- **Pending Material Requests**: Material requests awaiting approval

### Recent Activities
Shows the latest changes across quotations, projects, and invoices.

### Quick Actions
Role-based buttons for common tasks:
- **Sales**: Create New Quotation
- **Engineer**: Create Material Request
- **Accounting**: Create Invoice
- **Leader**: View Approval Queue

### Approval Queue (Leaders Only)
Displays items requiring approval:
- Material requests awaiting review
- Project reports awaiting approval

---

## Customer Management

### Viewing Customers

1. Click "Customers" in the sidebar
2. Use the search bar to find customers by:
   - Company name
   - Contact name
   - Email
   - Phone number
3. Click on a customer row to view details

### Creating a Customer

1. Click "Customers" in the sidebar
2. Click "Add Customer" button
3. Fill in the required fields:
   - **Company Name**: Customer's company name
   - **Contact Name**: Primary contact person
   - **Email**: Contact email address
   - **Phone**: Contact phone number
   - **Address** (optional): Physical address
4. Click "Create Customer"

### Editing a Customer

1. Navigate to the customer list
2. Click on the customer you want to edit
3. Click "Edit" button
4. Update the fields
5. Click "Save Changes"

### Deleting a Customer

1. Navigate to the customer list
2. Click on the customer you want to delete
3. Click "Delete" button
4. Confirm the deletion

**Note**: You cannot delete a customer if they have associated quotations or projects.

---

## Materials Catalog

### Viewing Materials

1. Click "Materials" in the sidebar
2. Use the search bar to find materials by:
   - Material name
   - Part number
   - Supplier
3. Filter by category using the dropdown
4. Click on a material to view details

### Creating a Material

1. Click "Materials" in the sidebar
2. Click "Add Material" button
3. Fill in the required fields:
   - **Name**: Material name
   - **Description**: Detailed description
   - **Category**: Material category (e.g., Electrical, Mechanical)
   - **Unit Type**: Unit of measurement (e.g., piece, meter, liter)
   - **Unit Cost**: Cost per unit
   - **Supplier** (optional): Supplier name
   - **Part Number** (optional): Manufacturer part number
4. Click "Create Material"

### Editing a Material

1. Navigate to the materials list
2. Click on the material you want to edit
3. Click "Edit" button
4. Update the fields
5. Click "Save Changes"

### Deleting a Material

1. Navigate to the materials list
2. Click on the material you want to delete
3. Click "Delete" button
4. Confirm the deletion

**Note**: You cannot delete a material if it's referenced in quotations or material requests.

---

## Quotation Management

### Creating a Quotation

1. Click "Quotations" in the sidebar
2. Click "New Quotation" button
3. Fill in the basic information:
   - **Customer**: Select from dropdown
   - **Title**: Quotation title
   - **Description**: Detailed description of work
   - **Labor Hours**: Estimated hours
   - **Labor Rate**: Rate per hour
   - **Profit Margin**: Percentage (e.g., 15 for 15%)
4. Click "Create Quotation"

### Adding Line Items

1. Open the quotation detail page
2. Scroll to "Line Items" section
3. Click "Add Line Item"
4. Fill in:
   - **Material** (optional): Select from catalog
   - **Description**: Item description
   - **Quantity**: Number of units
   - **Unit Price**: Price per unit
5. Click "Add"

The line total and quotation total will update automatically.

### Adding Scope of Work

1. Open the quotation detail page
2. Scroll to "Scope of Work" section
3. Click "Add Step"
4. Fill in:
   - **Step Number**: Sequential number
   - **Description**: Work description
   - **Work Category** (optional): Category of work
5. Click "Add"

### Quotation Status Workflow

Quotations follow this workflow:
1. **Draft**: Initial creation, can be edited
2. **Sent**: Sent to customer, awaiting response
3. **Approved**: Customer approved, can convert to project
4. **Rejected**: Customer declined

To change status:
1. Open the quotation detail page
2. Click the status dropdown
3. Select new status
4. Confirm the change

### Generating PDF

1. Open the quotation detail page
2. Click "Generate PDF" button
3. The PDF will download automatically

### Converting to Project

1. Open an **approved** quotation
2. Click "Convert to Project" button
3. A new project will be created
4. You'll be redirected to the project page

---

## Project Management

### Viewing Projects

1. Click "Projects" in the sidebar
2. Filter by:
   - **Status**: Planning, In Progress, Completed
   - **Assigned Engineer**: Filter by engineer
3. Click on a project to view details

### Creating a Project

**Option 1: From Approved Quotation**
1. Open an approved quotation
2. Click "Convert to Project"

**Option 2: Standalone Project**
1. Click "Projects" in the sidebar
2. Click "New Project" button
3. Fill in:
   - **Customer**: Select from dropdown
   - **Title**: Project title
   - **Description**: Project description
   - **Assigned Engineer**: Select engineer
   - **Start Date**: Project start date
   - **Expected Completion**: Target completion date
4. Click "Create Project"

### Project Status Workflow

Projects follow this workflow:
1. **Planning**: Initial planning phase
2. **In Progress**: Active work
3. **Completed**: Work finished

To change status:
1. Open the project detail page
2. Click the status dropdown
3. Select new status
4. Confirm the change

### Project Detail Page

The project detail page shows:
- **Project Information**: Basic details
- **Customer Information**: Linked customer
- **Quotation** (if applicable): Original quotation
- **Timeline**: Project dates and progress
- **Material Requests**: All material requests for this project
- **Costs**: All expenses tracked for this project
- **Invoices**: All invoices for this project
- **Reports**: Project completion reports

---

## Material Requests

### Creating a Material Request

1. Click "Material Requests" in the sidebar
2. Click "New Request" button
3. Fill in:
   - **Project**: Select project
   - **Title**: Request title
   - **Request Type**: Purchase or Warehouse
   - **Urgency**: Low, Medium, or High
4. Click "Create Request"

### Adding Items

1. Open the material request detail page
2. Scroll to "Request Items" section
3. Click "Add Item"
4. Fill in:
   - **Material** (optional): Select from catalog
   - **Description**: Item description
   - **Quantity**: Number of units
   - **Estimated Unit Cost**: Estimated cost per unit
5. Click "Add"

The estimated total cost will update automatically.

### Material Request Status Workflow

Material requests follow this workflow:
1. **Draft**: Initial creation, can be edited
2. **Submitted**: Submitted for review
3. **Under Review**: Being reviewed by leader
4. **Approved**: Approved by leader
5. **Rejected**: Rejected by leader

### Submitting for Approval

1. Open the material request detail page
2. Click "Submit for Approval" button
3. The status changes to "Submitted"
4. You can no longer edit the request

### Approving a Request (Leaders Only)

1. Open the material request detail page
2. Review the items and costs
3. Click "Approve" or "Reject" button
4. Add comments if needed
5. Confirm the action

---

## Expense Tracking

### Adding a Cost Entry

1. Open a project detail page
2. Scroll to "Costs" section
3. Click "Add Cost" button
4. Fill in:
   - **Cost Type**: Labor, Materials, Equipment, or Other
   - **Description**: Cost description
   - **Total Cost**: Amount
   - **Material** (optional): Link to material if applicable
   - **Quantity** (optional): Quantity if material-linked
   - **Unit Cost** (optional): Unit cost if material-linked
   - **Vendor** (optional): Vendor name
   - **Cost Date**: Date of expense
5. Click "Add Cost"

### Viewing Cost Summary

The costs section shows:
- **Total by Cost Type**: Grouped totals
- **Running Total**: Overall project costs
- **Individual Entries**: Detailed cost list

### Filtering Costs

Use the filters to view:
- Costs by cost type
- Costs by date range
- Costs by vendor

---

## Invoice Management

### Creating an Invoice

1. Click "Invoices" in the sidebar
2. Click "New Invoice" button
3. Fill in:
   - **Project**: Select project
   - **Customer**: Auto-filled from project
   - **Issue Date**: Invoice date
   - **Due Date**: Payment due date
   - **Notes** (optional): Additional notes
4. Click "Create Invoice"

### Adding Line Items

1. Open the invoice detail page
2. Scroll to "Line Items" section
3. Click "Add Line Item"
4. Fill in:
   - **Description**: Item description
   - **Quantity**: Number of units
   - **Unit Price**: Price per unit
5. Click "Add"

The line total and invoice total will update automatically.

### Invoice Status Workflow

Invoices follow this workflow:
1. **Draft**: Initial creation, can be edited
2. **Sent**: Sent to customer
3. **Partial**: Partially paid
4. **Paid**: Fully paid

### Recording a Payment

1. Open the invoice detail page
2. Click "Record Payment" button
3. Fill in:
   - **Payment Amount**: Amount received
   - **Payment Date**: Date of payment
   - **Payment Method**: How payment was received
4. Click "Record Payment"

The status will automatically update:
- If payment equals total: Status changes to "Paid"
- If payment is less than total: Status changes to "Partial"

### Generating PDF

1. Open the invoice detail page
2. Click "Generate PDF" button
3. The PDF will download automatically

---

## Project Reporting

### Creating a Project Report

1. Open a project detail page
2. Scroll to "Reports" section
3. Click "Create Report" button
4. Fill in:
   - **Completion Date**: Date work was completed
   - **Work Summary**: Description of work performed
   - **Materials Used**: List of materials used
5. Upload photos or documents (optional)
6. Capture customer signature (optional)
7. Click "Create Report"

### Submitting a Report

1. Open the report detail page
2. Review all information
3. Click "Submit for Approval" button
4. The status changes to "Submitted"

### Approving a Report (Authorized Users Only)

1. Open the report detail page
2. Review the work summary and materials
3. Check uploaded photos/documents
4. Verify customer signature
5. Click "Approve" button
6. Confirm the approval

**Note**: When a report is approved, the project status automatically updates to "Completed".

---

## User Roles

### Leader
**Full Access** - Can perform all actions including:
- Approve material requests
- Approve project reports
- Manage all entities
- View approval queue

### Sales
**Focus**: Customer relationships and quotations
- Manage customers
- Create and manage quotations
- Convert quotations to projects
- View projects and invoices

### Accounting
**Focus**: Financial management
- Create and manage invoices
- Record payments
- Track project costs
- View financial reports

### Engineer
**Focus**: Project execution
- View assigned projects
- Create material requests
- Track project costs
- Create project reports
- View materials catalog

---

## Tips and Best Practices

### Quotations
- Always add detailed line items for accurate costing
- Include comprehensive scope of work for customer clarity
- Generate PDF before sending to customer
- Only convert approved quotations to projects

### Projects
- Assign engineers as soon as project starts
- Keep expected completion dates updated
- Track all costs as they occur
- Create material requests early to avoid delays

### Material Requests
- Be specific in item descriptions
- Provide accurate quantity estimates
- Set appropriate urgency levels
- Submit for approval with sufficient lead time

### Invoices
- Create invoices promptly after work completion
- Include detailed line items
- Set realistic due dates
- Record payments immediately when received

### Reports
- Document all work performed
- Upload photos of completed work
- Get customer signature when possible
- Submit reports promptly after completion

---

## Troubleshooting

### Cannot Login
- Verify email and password are correct
- Check with system administrator if account is active
- Clear browser cache and try again

### Cannot Delete Customer/Material
- Check if there are related quotations or projects
- Remove dependencies first, then delete

### Cannot Edit Material Request
- Material requests cannot be edited after submission
- Contact a leader to reject and return to draft status

### PDF Not Generating
- Ensure all required fields are filled
- Check browser allows downloads
- Try a different browser if issue persists

### Changes Not Saving
- Check for validation errors (red text)
- Ensure all required fields are filled
- Check internet connection
- Try refreshing the page

---

## Support

For technical support or questions:
1. Contact your system administrator
2. Refer to the technical documentation
3. Check the deployment and setup guides

---

**Document Version**: 1.0.0  
**Last Updated**: February 8, 2026  
**System Version**: NAS 1.0.0
