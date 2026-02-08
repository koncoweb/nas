# Checkpoint 12: Project Workflow Verification Guide

## Overview

This checkpoint verifies that the complete quotation → project → material request workflow functions correctly end-to-end. This is a critical integration test that ensures all three major features work together seamlessly.

## Automated Verification

### Running the Verification Script

```bash
# Make sure the development server is running
npm run dev

# In a separate terminal, run the verification script
node verify-project-workflow.js
```

The script will:
1. ✓ Verify database connection
2. ✓ Create test customer
3. ✓ Create test material
4. ✓ Create test quotation
5. ✓ Add line items to quotation
6. ✓ Add scope of work items
7. ✓ Approve quotation
8. ✓ Convert quotation to project
9. ✓ Update project status
10. ✓ Create material request for project
11. ✓ Add items to material request
12. ✓ Submit material request
13. ✓ Approve material request
14. ✓ Verify workflow integrity
15. ✓ Report results

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║     NAS REBUILD - PROJECT WORKFLOW VERIFICATION            ║
║     Checkpoint 12: Quotation → Project → Material Request  ║
╚════════════════════════════════════════════════════════════╝

============================================================
Step 1: Verify Database Connection
============================================================

✓ Database connection successful
ℹ Database: Connected

[... continues through all steps ...]

============================================================
Verification Summary
============================================================

ℹ Total Steps: 15
✓ Passed: 15
✗ Failed: 0

✓ ALL CHECKS PASSED - Project workflow is functioning correctly!
```

## Manual Testing Workflow

If you prefer to test manually or if the automated script fails, follow these steps:

### Prerequisites

1. Development server running: `npm run dev`
2. Database connected and accessible
3. User logged in with appropriate permissions

### Step-by-Step Manual Test

#### 1. Create a Customer

1. Navigate to `/customers`
2. Click "New Customer"
3. Fill in the form:
   - Company Name: "Test Marine Co"
   - Contact Name: "John Smith"
   - Email: "john@testmarine.com"
   - Phone: "555-0100"
   - Address: "123 Harbor St"
4. Click "Create Customer"
5. ✓ Verify customer appears in the list

#### 2. Create a Material

1. Navigate to `/materials`
2. Click "New Material"
3. Fill in the form:
   - Name: "Marine Grade Bolt"
   - Category: "Hardware"
   - Unit Type: "piece"
   - Unit Cost: 2.50
   - Supplier: "Marine Supply Co"
   - Part Number: "MGB-001"
4. Click "Create Material"
5. ✓ Verify material appears in the list

#### 3. Create a Quotation

1. Navigate to `/quotations`
2. Click "New Quotation"
3. Fill in the form:
   - Customer: Select "Test Marine Co"
   - Title: "Engine Repair and Maintenance"
   - Description: "Complete engine overhaul"
   - Labor Hours: 40
   - Labor Rate: 75
   - Profit Margin: 15%
4. Click "Create Quotation"
5. ✓ Verify quotation is created with status "draft"

#### 4. Add Line Items to Quotation

1. On the quotation detail page, find "Line Items" section
2. Click "Add Line Item"
3. Add first item:
   - Material: Select "Marine Grade Bolt"
   - Quantity: 50
   - Unit Price: 2.50 (should auto-fill)
4. Click "Add"
5. Add second item:
   - Description: "Custom gasket set"
   - Quantity: 1
   - Unit Price: 150.00
6. Click "Add"
7. ✓ Verify line items appear in the table
8. ✓ Verify materials cost is calculated: $275.00

#### 5. Add Scope of Work

1. On the quotation detail page, find "Scope of Work" section
2. Click "Add Step"
3. Add steps:
   - Step 1: "Disassemble engine and inspect components"
   - Step 2: "Replace worn parts and gaskets"
   - Step 3: "Reassemble and test engine"
4. ✓ Verify all steps appear in order

#### 6. Review Calculated Costs

1. On the quotation detail page, verify:
   - Materials Cost: $275.00
   - Labor Cost: $3,000.00 (40 hours × $75)
   - Subtotal: $3,275.00
   - Profit (15%): $491.25
   - Total Cost: $3,766.25
2. ✓ Verify all calculations are correct

#### 7. Approve Quotation

1. On the quotation detail page:
2. Click "Change Status" → "Sent"
3. ✓ Verify status changes to "sent"
4. Click "Change Status" → "Approved"
5. ✓ Verify status changes to "approved"
6. ✓ Verify "Convert to Project" button appears

#### 8. Convert to Project

1. On the approved quotation page:
2. Click "Convert to Project"
3. ✓ Verify success message appears
4. ✓ Verify redirect to new project page
5. ✓ Verify project has:
   - Unique project number
   - Same title as quotation
   - Same customer
   - Status: "planning"
   - Link back to original quotation

#### 9. Update Project Status

1. On the project detail page:
2. Click "Edit Project"
3. Change status to "in_progress"
4. Set start date to today
5. Set expected completion to 2 weeks from now
6. Optionally assign an engineer
7. Click "Save"
8. ✓ Verify status updated to "in_progress"
9. ✓ Verify dates are saved

#### 10. Create Material Request

1. On the project detail page:
2. Click "New Material Request"
3. Fill in the form:
   - Title: "Materials for Engine Repair"
   - Request Type: "Purchase"
   - Urgency: "Medium"
4. Click "Create"
5. ✓ Verify material request is created with status "draft"
6. ✓ Verify it's linked to the project

#### 11. Add Items to Material Request

1. On the material request detail page:
2. Click "Add Item"
3. Add first item:
   - Material: Select "Marine Grade Bolt"
   - Quantity: 100
   - Estimated Unit Cost: 2.50 (should auto-fill)
4. Click "Add"
5. Add second item:
   - Description: "Engine oil filter"
   - Quantity: 2
   - Estimated Unit Cost: 25.00
6. Click "Add"
7. ✓ Verify items appear in the table
8. ✓ Verify estimated total cost: $300.00

#### 12. Submit Material Request

1. On the material request detail page:
2. Click "Submit Request"
3. ✓ Verify status changes to "submitted"
4. ✓ Verify items can no longer be edited

#### 13. Approve Material Request

1. On the material request detail page (as a leader):
2. Click "Approve Request"
3. ✓ Verify status changes to "approved"
4. ✓ Verify approval timestamp is recorded

#### 14. Verify Complete Workflow

Navigate through the workflow to verify all connections:

1. **From Customer Page:**
   - ✓ View customer detail
   - ✓ See linked quotations
   - ✓ See linked projects

2. **From Quotation Page:**
   - ✓ View quotation detail
   - ✓ See all line items and scope of work
   - ✓ See calculated costs
   - ✓ See link to converted project

3. **From Project Page:**
   - ✓ View project detail
   - ✓ See link to original quotation
   - ✓ See customer information
   - ✓ See linked material requests
   - ✓ See project timeline

4. **From Material Request Page:**
   - ✓ View material request detail
   - ✓ See link to project
   - ✓ See all requested items
   - ✓ See calculated estimated cost

## Workflow Integrity Checks

### Data Consistency

- [ ] Project customer_id matches quotation customer_id
- [ ] Project quotation_id correctly references the quotation
- [ ] Material request project_id correctly references the project
- [ ] All foreign key relationships are valid

### Status Progression

- [ ] Quotation: draft → sent → approved
- [ ] Project: planning → in_progress
- [ ] Material Request: draft → submitted → approved

### Cost Calculations

- [ ] Quotation total = (labor_hours × labor_rate) + materials_cost + profit
- [ ] Material request total = sum of (quantity × estimated_unit_cost) for all items
- [ ] All calculations use proper decimal precision

### Business Rules

- [ ] Cannot convert quotation to project unless approved
- [ ] Cannot edit material request items after submission
- [ ] Cannot delete customer with linked quotations/projects
- [ ] Cannot delete material with linked quotation line items

## Troubleshooting

### Common Issues

**Issue: Database connection fails**
- Check DATABASE_URL in .env.local
- Verify Neon database is accessible
- Check network connectivity

**Issue: Quotation conversion fails**
- Verify quotation status is "approved"
- Check for database constraint violations
- Review server logs for errors

**Issue: Material request approval fails**
- Verify user has "leader" role
- Check material request status is "submitted"
- Review authorization middleware

**Issue: Cost calculations incorrect**
- Verify all numeric fields are properly typed
- Check for floating point precision issues
- Review calculation logic in API routes

### Debug Mode

To enable detailed logging:

```bash
# Set environment variable
export DEBUG=nas:*

# Run verification script
node verify-project-workflow.js
```

## Success Criteria

This checkpoint is considered PASSED when:

1. ✓ All automated verification steps pass
2. ✓ Manual workflow can be completed without errors
3. ✓ All data relationships are correct
4. ✓ All status transitions work as expected
5. ✓ All cost calculations are accurate
6. ✓ No console errors during workflow execution
7. ✓ Database integrity is maintained throughout

## Next Steps

After passing this checkpoint:

1. Proceed to Task 13: Expense Tracking Feature
2. Continue building remaining features
3. Keep this workflow test as a regression test
4. Run this verification before each deployment

## Notes

- This checkpoint validates the core business workflow
- All three features (quotations, projects, material requests) must work together
- This is a critical integration point in the application
- Any failures here indicate fundamental issues that must be resolved
- Test data created by the script can be inspected in the database
- Consider adding this verification to CI/CD pipeline
