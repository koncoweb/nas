# Demo Accounts - Marine Engineering Project Management System

## 🚀 Quick Access

Sistem ini dilengkapi dengan 4 akun demo yang mendemonstrasikan berbagai level akses berdasarkan role pengguna.

**Semua akun menggunakan password:** `password123`

## 👥 Available Demo Accounts

### 🔴 Leader Account
- **Email:** `admin@nas2.com`
- **Password:** `password123`
- **Access Level:** Full System Access (Level 4)

**Permissions:**
- ✅ Complete system administration
- ✅ User management and role assignment
- ✅ All financial reports and data
- ✅ Project creation, editing, and deletion
- ✅ Customer and material management
- ✅ Approval workflows
- ✅ Invoice and payment management
- ✅ System settings and configuration

**Use Case:** System administrator, company owner, or general manager

---

### 🟡 Accounting Account
- **Email:** `accounting@nas2.com`
- **Password:** `password123`
- **Access Level:** Financial & Administrative (Level 3)

**Permissions:**
- ✅ All financial reports and analytics
- ✅ Invoice creation and management
- ✅ Project cost tracking and budgets
- ✅ Material request approvals
- ✅ Customer data management
- ✅ Quotation editing and approval
- ❌ User management
- ❌ System settings

**Use Case:** Accounting manager, financial controller, or business analyst

---

### 🔵 Engineer Account
- **Email:** `engineer@nas2.com`
- **Password:** `password123`
- **Access Level:** Technical Operations (Level 2)

**Permissions:**
- ✅ Assigned project management
- ✅ Technical documentation and reports
- ✅ Material request creation
- ✅ Project progress updates
- ✅ Customer technical information
- ✅ Material specifications and inventory
- ❌ Financial data access
- ❌ Project creation/deletion
- ❌ User management

**Use Case:** Project engineer, technical lead, or field supervisor

---

### 🟢 Sales Account
- **Email:** `sales@nas2.com`
- **Password:** `password123`
- **Access Level:** Customer Relations (Level 1)

**Permissions:**
- ✅ Customer relationship management
- ✅ Quotation creation and editing (own)
- ✅ Basic project information view
- ✅ Material catalog browsing
- ✅ Customer communication logs
- ❌ Financial reports
- ❌ Project management
- ❌ Material requests
- ❌ User management

**Use Case:** Sales representative, customer service, or business development

## 🎯 Role Hierarchy

```
Leader (4) ──────────── Full Access
    │
    ├── Accounting (3) ── Financial + Admin
    │
    ├── Engineer (2) ──── Technical Operations
    │
    └── Sales (1) ──────── Customer Relations
```

## 🔐 Security Features

- **Password Hashing:** Argon2 encryption
- **Session Management:** Database-backed sessions
- **Role-Based Access:** Hierarchical permission system
- **CSRF Protection:** Built-in security measures
- **Database Integration:** Neon PostgreSQL with connection pooling

## 📱 How to Use Demo Accounts

### Method 1: Login Page Quick Access
1. Go to the login page
2. Click on any demo account button
3. Credentials will be auto-filled
4. Click "Sign In"

### Method 2: Manual Entry
1. Go to `/account/signin`
2. Enter email and password manually
3. Click "Sign In"

### Method 3: API Testing
```bash
# Test login via API
curl -X POST http://localhost:4000/api/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nas2.com","password":"password123"}'
```

## 🧪 Testing Different Roles

### Leader Testing
```javascript
// Login as leader
const response = await fetch('/api/test-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@nas2.com',
    password: 'password123'
  })
});

// Test leader-only endpoint
const leaderData = await fetch('/api/test-leader-only');
// Should return: 200 OK with admin dashboard data
```

### Sales Testing
```javascript
// Login as sales
const response = await fetch('/api/test-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'sales@nas2.com',
    password: 'password123'
  })
});

// Test leader-only endpoint
const leaderData = await fetch('/api/test-leader-only');
// Should return: 403 Forbidden
```

## 🎨 UI/UX Features

### Visual Role Indicators
- **Red dot:** Leader (Full Access)
- **Yellow dot:** Accounting (Financial)
- **Blue dot:** Engineer (Technical)
- **Green dot:** Sales (Customer)

### Responsive Design
- Desktop: Side-by-side layout
- Mobile: Stacked layout with demo accounts on top
- Touch-friendly buttons and interactions

### Auto-Fill Functionality
- One-click credential filling
- Smooth user experience
- Clear visual feedback

## 🔧 Technical Implementation

### Database Schema
```sql
-- Users with roles
CREATE TABLE auth_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  user_role VARCHAR(20) DEFAULT 'sales' CHECK (
    user_role IN ('leader', 'sales', 'accounting', 'engineer')
  )
);

-- Credential storage
CREATE TABLE auth_accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES auth_users(id),
  provider VARCHAR(255) NOT NULL,
  password TEXT -- Argon2 hashed
);
```

### Permission System
```javascript
const permissions = {
  'leader': ['all'],
  'accounting': ['financial', 'approvals', 'customers'],
  'engineer': ['projects', 'materials', 'requests'],
  'sales': ['customers', 'quotations', 'basic_view']
};
```

## 📊 Sample Data

Each demo account comes with relevant sample data:

- **Projects:** Marine vessel maintenance and repair projects
- **Customers:** Shipping companies and marine service providers
- **Materials:** Marine engineering components and supplies
- **Quotations:** Service quotes for various marine projects
- **Invoices:** Billing records and payment tracking

## 🚀 Getting Started

1. **Choose Your Role:** Select the demo account that matches your testing needs
2. **Explore Features:** Navigate through different sections based on your role
3. **Test Permissions:** Try accessing restricted areas to see role-based security
4. **Create Data:** Add new records to see the system in action
5. **Switch Roles:** Logout and try different accounts to compare access levels

## 📞 Support

For questions about demo accounts or system functionality:
- Check the AUTH_TESTING.md file for technical details
- Review API endpoints for integration testing
- Examine role-based permissions in the codebase

---

**Note:** These are demo accounts for testing purposes. In production, create proper user accounts with secure passwords and appropriate role assignments.