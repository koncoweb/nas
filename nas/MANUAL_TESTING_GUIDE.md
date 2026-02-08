# Manual Testing Guide - Checkpoint 8

## Quick Start

### 1. Setup Environment
```bash
cd nas
cp .env.local.example .env.local
# Edit .env.local and add your DATABASE_URL and AUTH_SECRET
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Application
Open http://localhost:3000 in your browser

## Test Scenarios

### A. Authentication Flow

#### Test 1: Login Page
1. Navigate to http://localhost:3000
2. Should redirect to `/login`
3. Verify login form displays with email and password fields

#### Test 2: Valid Login
1. Enter valid credentials (email and password from your database)
2. Click "Sign In"
3. Should redirect to `/dashboard`
4. Verify user name appears in header

#### Test 3: Invalid Login
1. Enter invalid credentials
2. Click "Sign In"
3. Should display error message
4. Should remain on login page

#### Test 4: Logout
1. Click user menu in header
2. Click "Logout"
3. Should redirect to `/login`
4. Verify session is cleared

### B. Customer Management

#### Test 5: View Customers List
1. Navigate to `/customers`
2. Verify customer table displays
3. Check pagination controls appear
4. Verify search bar is present

#### Test 6: Search Customers
1. On `/customers` page
2. Enter search term in search bar
3. Verify results filter in real-time
4. Try searching by:
   - Company name
   - Contact name
   - Email
   - Phone number

#### Test 7: Create Customer
1. Click "Add Customer" button
2. Verify modal opens
3. Fill in form:
   - Company Name: "Test Company"
   - Contact Name: "John Doe"
   - Email: "john@test.com"
   - Phone: "555-0123"
   - Address: "123 Test St"
4. Click "Create"
5. Verify success message
6. Verify new customer appears in list

#### Test 8: Edit Customer
1. Click on a customer row
2. Navigate to customer detail page
3. Click "Edit" button
4. Modify fields
5. Click "Save"
6. Verify changes are saved
7. Verify updated data displays

#### Test 9: Delete Customer
1. On customer detail page
2. Click "Delete" button
3. Confirm deletion
4. Verify customer is removed
5. Verify redirect to customers list

#### Test 10: Form Validation
1. Click "Add Customer"
2. Try to submit empty form
3. Verify validation errors appear
4. Enter invalid email (e.g., "notanemail")
5. Verify email validation error
6. Fill all required fields correctly
7. Verify form submits successfully

#### Test 11: Pagination
1. On `/customers` page
2. If more than 25 customers exist:
   - Click "Next" button
   - Verify page 2 loads
   - Click "Previous" button
   - Verify page 1 loads
3. Change page size (10, 25, 50, 100)
4. Verify results update accordingly

### C. Materials Catalog

#### Test 12: View Materials List
1. Navigate to `/materials`
2. Verify materials table displays
3. Check pagination controls appear
4. Verify search bar and category filter present

#### Test 13: Search Materials
1. On `/materials` page
2. Enter search term
3. Verify results filter
4. Try searching by:
   - Material name
   - Part number
   - Supplier

#### Test 14: Filter by Category
1. On `/materials` page
2. Select a category from dropdown
3. Verify only materials in that category display
4. Select "All Categories"
5. Verify all materials display again

#### Test 15: Create Material
1. Click "Add Material" button
2. Fill in form:
   - Name: "Test Material"
   - Description: "Test description"
   - Category: "Hardware"
   - Unit Type: "piece"
   - Unit Cost: "25.50"
   - Supplier: "Test Supplier"
   - Part Number: "PN-12345"
3. Click "Create"
4. Verify success message
5. Verify new material appears in list

#### Test 16: Edit Material
1. Click on a material row
2. Click "Edit" button
3. Modify fields
4. Click "Save"
5. Verify changes are saved

#### Test 17: Delete Material
1. On material detail page
2. Click "Delete" button
3. Confirm deletion
4. Verify material is removed

#### Test 18: Material Form Validation
1. Click "Add Material"
2. Try to submit with negative unit cost
3. Verify validation error
4. Try to submit without required fields
5. Verify validation errors
6. Fill correctly and submit
7. Verify success

### D. Dashboard

#### Test 19: View Dashboard
1. Navigate to `/dashboard`
2. Verify statistics cards display:
   - Active Projects count
   - Pending Quotations count
   - Pending Material Requests count
3. Verify recent activities list displays
4. Check that quick action buttons appear

#### Test 20: Dashboard Statistics Accuracy
1. Note the statistics on dashboard
2. Manually query database:
   ```sql
   SELECT COUNT(*) FROM projects WHERE status = 'in_progress';
   SELECT COUNT(*) FROM quotations WHERE status = 'draft';
   SELECT COUNT(*) FROM material_requests WHERE status = 'submitted';
   ```
3. Verify dashboard counts match database

#### Test 21: Role-Based Dashboard
1. Login as different user roles:
   - Leader
   - Sales
   - Accounting
   - Engineer
2. Verify appropriate quick actions appear for each role
3. Verify approval queue appears for leader role

### E. Navigation and Layout

#### Test 22: Sidebar Navigation
1. Verify sidebar displays on all pages
2. Click each menu item:
   - Dashboard
   - Customers
   - Materials
   - Quotations (if implemented)
   - Projects (if implemented)
   - Material Requests (if implemented)
   - Invoices (if implemented)
3. Verify navigation works correctly
4. Verify active page is highlighted

#### Test 23: Header
1. Verify header displays on all pages
2. Check user name appears
3. Click user menu
4. Verify dropdown opens
5. Verify logout option present

#### Test 24: Responsive Design
1. Resize browser window
2. Test at different widths:
   - Desktop (1920px)
   - Laptop (1366px)
   - Tablet (768px)
   - Mobile (375px)
3. Verify layout adapts appropriately
4. Verify sidebar collapses on mobile
5. Verify tables scroll horizontally if needed

### F. Error Handling

#### Test 25: Database Connection Error
1. Stop database or use invalid DATABASE_URL
2. Try to access any page
3. Verify error message displays
4. Verify error doesn't expose sensitive information

#### Test 26: API Error Handling
1. Use browser dev tools to simulate network error
2. Try to create/update/delete record
3. Verify error message displays
4. Verify user-friendly error message

#### Test 27: 404 Page
1. Navigate to non-existent route (e.g., `/nonexistent`)
2. Verify 404 page displays
3. Verify navigation still works

### G. Data Integrity

#### Test 28: Referential Integrity - Customers
1. Create a customer
2. Create a quotation linked to that customer
3. Try to delete the customer
4. Verify deletion is prevented
5. Verify error message explains why

#### Test 29: Referential Integrity - Materials
1. Create a material
2. Add material to a quotation line item
3. Try to delete the material
4. Verify deletion is prevented
5. Verify error message explains why

#### Test 30: Concurrent Updates
1. Open same customer in two browser tabs
2. Edit customer in tab 1 and save
3. Edit customer in tab 2 and save
4. Verify last save wins (or implement optimistic locking)

## Performance Testing

### Test 31: Large Dataset
1. Add 1000+ customers to database
2. Navigate to `/customers`
3. Verify page loads in reasonable time (<2 seconds)
4. Test pagination performance
5. Test search performance

### Test 32: API Response Times
1. Use browser dev tools Network tab
2. Monitor API response times
3. Verify responses are under 500ms for:
   - GET requests
   - POST requests
   - PUT requests
   - DELETE requests

## Security Testing

### Test 33: Authentication Required
1. Logout
2. Try to access `/dashboard` directly
3. Verify redirect to `/login`
4. Try to access `/customers` directly
5. Verify redirect to `/login`

### Test 34: API Authentication
1. Logout
2. Use browser dev tools or Postman
3. Try to call API endpoints without authentication:
   - GET /api/customers
   - POST /api/customers
   - GET /api/materials
4. Verify 401 Unauthorized response

### Test 35: SQL Injection Prevention
1. In search fields, try SQL injection:
   - `'; DROP TABLE customers; --`
   - `' OR '1'='1`
2. Verify no SQL injection occurs
3. Verify search returns no results or safe results

### Test 36: XSS Prevention
1. Try to create customer with XSS in name:
   - `<script>alert('XSS')</script>`
2. Verify script doesn't execute
3. Verify data is properly escaped

## Browser Compatibility

### Test 37: Cross-Browser Testing
Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Verify all features work in each browser.

## Accessibility Testing

### Test 38: Keyboard Navigation
1. Use only keyboard (Tab, Enter, Escape)
2. Navigate through forms
3. Verify all interactive elements are accessible
4. Verify focus indicators are visible

### Test 39: Screen Reader
1. Use screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through pages
3. Verify labels are read correctly
4. Verify form errors are announced

## Test Results Template

```
Date: ___________
Tester: ___________
Environment: Development / Staging / Production

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Login Page | ☐ Pass ☐ Fail | |
| 2 | Valid Login | ☐ Pass ☐ Fail | |
| 3 | Invalid Login | ☐ Pass ☐ Fail | |
| ... | ... | ... | |

Overall Status: ☐ All Pass ☐ Some Failures

Critical Issues:
1. 
2. 

Minor Issues:
1. 
2. 

Recommendations:
1. 
2. 
```

## Automated Testing (Future)

For future implementation:
- Unit tests for API routes
- Integration tests for database operations
- E2E tests with Playwright or Cypress
- Property-based tests for validation logic

---

**Note:** This is a comprehensive manual testing guide. For checkpoint verification, focus on critical path tests (1-21) to ensure core functionality works correctly.
