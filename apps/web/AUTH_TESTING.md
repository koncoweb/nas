# Auth System Testing Guide

## Overview
Sistem auth telah dikonfigurasi dengan Neon DB dan mendukung role-based access control dengan 4 level user:

1. **Leader** - Full access (level 4)
2. **Accounting** - Financial + project access (level 3)  
3. **Engineer** - Project execution access (level 2)
4. **Sales** - Customer + quotation access (level 1)

## Test Users
Semua user menggunakan password: `password123`

| Email | Role | Access Level |
|-------|------|--------------|
| admin@nas2.com | leader | 4 |
| accounting@nas2.com | accounting | 3 |
| engineer@nas2.com | engineer | 2 |
| sales@nas2.com | sales | 1 |

## API Endpoints untuk Testing

### 1. Login Test
```bash
POST /api/test-login
Content-Type: application/json

{
  "email": "admin@nas2.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@nas2.com",
    "user_role": "leader"
  },
  "sessionToken": "uuid-session-token"
}
```

### 2. Role Permissions Test
```bash
GET /api/test-roles
```

**Response (Leader):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User", 
    "email": "admin@nas2.com",
    "role": "leader"
  },
  "roleLevel": 4,
  "permissions": {
    "canViewAllProjects": true,
    "canCreateProjects": true,
    "canManageUsers": true,
    "canViewFinancials": true,
    "canApproveRequests": true
  }
}
```

### 3. Leader-Only Access Test
```bash
GET /api/test-leader-only
```

**Success (Leader):**
```json
{
  "success": true,
  "message": "Welcome, Leader!",
  "data": {
    "totalUsers": 4,
    "totalProjects": 0,
    "totalRevenue": 0,
    "pendingApprovals": 0
  }
}
```

**Forbidden (Non-Leader):**
```json
{
  "error": "Forbidden",
  "message": "Only leaders can access this endpoint",
  "yourRole": "sales"
}
```

### 4. Financial Access Test
```bash
GET /api/test-financial
```

**Success (Leader/Accounting):**
```json
{
  "success": true,
  "message": "Financial data access granted",
  "data": {
    "totalRevenue": 1500000,
    "totalExpenses": 800000,
    "profit": 700000,
    "pendingInvoices": 5
  }
}
```

**Forbidden (Engineer/Sales):**
```json
{
  "error": "Forbidden",
  "message": "Only leaders and accounting can access financial data",
  "yourRole": "engineer"
}
```

## Role Hierarchy & Permissions

### Leader (Level 4)
- ✅ View all projects
- ✅ Create/edit/delete projects
- ✅ View all quotations
- ✅ Create/edit/delete quotations
- ✅ View all customers
- ✅ Create/edit/delete customers
- ✅ View all materials
- ✅ Create/edit/delete materials
- ✅ View financial reports
- ✅ Manage users
- ✅ Approve material requests
- ✅ View/create/edit invoices

### Accounting (Level 3)
- ✅ View all projects
- ✅ View all quotations
- ✅ Edit quotations
- ✅ View all customers
- ✅ Create/edit customers
- ✅ View all materials
- ✅ View financial reports
- ✅ Approve material requests
- ✅ View/create/edit invoices
- ❌ Manage users
- ❌ Delete projects/quotations

### Engineer (Level 2)
- ✅ View assigned projects
- ✅ Edit assigned projects
- ✅ View quotations
- ✅ View customers
- ✅ View materials
- ✅ Create material requests
- ✅ View own material requests
- ❌ View financial reports
- ❌ Manage users
- ❌ Create projects/quotations

### Sales (Level 1)
- ✅ View assigned projects
- ✅ View quotations
- ✅ Create quotations
- ✅ Edit own quotations
- ✅ View customers
- ✅ Create/edit customers
- ✅ View materials
- ❌ View financial reports
- ❌ Manage users
- ❌ Approve requests

## Testing Commands

### PowerShell Commands for Testing

```powershell
# Test login as leader
$body = '{"email":"admin@nas2.com","password":"password123"}'
Invoke-WebRequest -Uri "http://localhost:4000/api/test-login" -Method POST -ContentType "application/json" -Body $body

# Test login as sales
$body = '{"email":"sales@nas2.com","password":"password123"}'
Invoke-WebRequest -Uri "http://localhost:4000/api/test-login" -Method POST -ContentType "application/json" -Body $body

# Test basic endpoints
Invoke-WebRequest -Uri "http://localhost:4000/api/test" -Method GET
Invoke-WebRequest -Uri "http://localhost:4000/api/test-db" -Method GET
Invoke-WebRequest -Uri "http://localhost:4000/api/test-auth" -Method GET
```

## Database Schema

### auth_users
```sql
CREATE TABLE auth_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  user_role VARCHAR(20) DEFAULT 'sales' CHECK (
    user_role IN ('leader', 'sales', 'accounting', 'engineer')
  )
);
```

### auth_accounts
```sql
CREATE TABLE auth_accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  password TEXT -- Argon2 hashed password
);
```

### auth_sessions
```sql
CREATE TABLE auth_sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL
);
```

## Integration dengan Frontend

Untuk mengintegrasikan dengan React frontend:

```javascript
// Login function
async function login(email, password) {
  const response = await fetch('/api/test-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('sessionToken', data.sessionToken);
    return data.user;
  }
  throw new Error('Login failed');
}

// Check permissions
function hasPermission(user, permission) {
  const permissions = {
    'leader': ['all'],
    'accounting': ['view_financial', 'approve_requests'],
    'engineer': ['view_projects', 'create_requests'],
    'sales': ['view_customers', 'create_quotations']
  };
  
  return permissions[user.user_role]?.includes(permission) || 
         permissions[user.user_role]?.includes('all');
}
```

## Status
✅ Auth system fully configured with Neon DB
✅ Role-based access control implemented
✅ 4 user roles with different permission levels
✅ Session management working
✅ Password hashing with Argon2
✅ Test endpoints created and working
✅ Database schema properly set up