# Login Credentials - NAS Marine Engineering System

## Available Test Accounts

Berikut adalah akun-akun yang tersedia di database untuk testing:

### 1. Admin / Leader Account ⭐ (Recommended)

**Email:** `admin@nas2.com`  
**Password:** `password123`  
**Role:** Leader  
**Permissions:** Full access - dapat approve material requests, approve reports, manage semua data

**Use this account for:**
- Testing approval workflows
- Managing all features
- Full system access

---

### 2. Sales Account

**Email:** `sales@nas2.com`  
**Password:** `password123`  
**Role:** Sales  
**Permissions:** Create quotations, manage customers, view projects

**Use this account for:**
- Testing quotation creation
- Customer management
- Sales workflows

---

### 3. Engineer Account

**Email:** `engineer@nas2.com`  
**Password:** `password123`  
**Role:** Engineer  
**Permissions:** View assigned projects, create material requests, submit reports

**Use this account for:**
- Testing project execution
- Material request workflows
- Report submission

---

### 4. Accounting Account

**Email:** `accounting@nas2.com`  
**Password:** `password123`  
**Role:** Accounting  
**Permissions:** Manage invoices, view financial data, track costs

**Use this account for:**
- Testing invoice management
- Financial tracking
- Payment recording

---

## Quick Start

1. **Start the development server:**
   ```bash
   cd nas
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Login with Admin account:**
   - Email: `admin@nas2.com`
   - Password: `password123`

4. **Explore the dashboard!**

---

## Role Permissions Matrix

| Feature | Leader | Sales | Engineer | Accounting |
|---------|--------|-------|----------|------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | 👁️ View | 👁️ View |
| Materials | ✅ | ✅ | 👁️ View | 👁️ View |
| Quotations | ✅ | ✅ Create | 👁️ View | 👁️ View |
| Projects | ✅ | 👁️ View | ✅ Assigned | 👁️ View |
| Material Requests | ✅ Approve | ❌ | ✅ Create | 👁️ View |
| Costs | ✅ | 👁️ View | ✅ Add | ✅ |
| Invoices | ✅ | 👁️ View | ❌ | ✅ |
| Reports | ✅ Approve | 👁️ View | ✅ Submit | 👁️ View |

Legend:
- ✅ Full access
- 👁️ View only
- ❌ No access

---

## Password Information

**All test accounts use the same password:** `password123`

**Password is hashed using Argon2** for security. The application uses Argon2id with the following parameters:
- Memory cost: 65536 KB
- Time cost: 3 iterations
- Parallelism: 4 threads

**Note:** In production, ensure users change their passwords and use strong, unique passwords.

---

## Troubleshooting

### Cannot login?

1. **Verify dev server is running:**
   ```bash
   npm run dev
   ```

2. **Check .env.local file:**
   - DATABASE_URL should be set
   - AUTH_SECRET should be set
   - NEXTAUTH_URL should be `http://localhost:3000`

3. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application → Cookies → Clear all

4. **Check database connection:**
   - Verify Neon database is accessible
   - Check connection string in .env.local

### "Invalid credentials" error?

- Double-check email and password
- Email is case-sensitive
- Password is exactly: `password123` (no spaces)

### Session issues?

- Clear browser cookies
- Restart dev server
- Check AUTH_SECRET in .env.local

---

## Security Notes

⚠️ **Important for Production:**

1. **Change all default passwords** before deploying to production
2. **Use strong passwords** (minimum 12 characters, mixed case, numbers, symbols)
3. **Enable 2FA** if implementing additional security
4. **Rotate AUTH_SECRET** regularly
5. **Monitor login attempts** for suspicious activity
6. **Implement rate limiting** on login endpoint
7. **Use HTTPS** in production (required for secure cookies)

---

**Created:** February 8, 2026  
**Database:** NAS2 (Neon PostgreSQL)  
**Last Updated:** February 8, 2026
