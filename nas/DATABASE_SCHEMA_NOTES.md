# Database Schema Notes - NAS2

## Overview
This document describes the actual database schema from the Neon PostgreSQL database (project: NAS2, id: misty-wave-96189879) and how it differs from the initial assumptions in the design document.

## Authentication Tables

### auth_users
**Purpose:** Stores user account information

**Columns:**
- `id` (integer, PRIMARY KEY) - Auto-incrementing user ID
- `name` (varchar, nullable) - User's full name
- `email` (varchar, nullable) - User's email address
- `emailVerified` (timestamp with time zone, nullable) - Email verification timestamp
- `image` (text, nullable) - User profile image URL
- `user_role` (varchar, nullable, default: 'sales') - User role with CHECK constraint

**Constraints:**
- CHECK: user_role must be one of: 'leader', 'sales', 'accounting', 'engineer'

**Important Notes:**
- User ID is an **integer**, not a string
- Password is **NOT** stored in this table (stored in auth_accounts instead)

### auth_accounts
**Purpose:** Stores authentication provider information and credentials

**Columns:**
- `id` (integer, PRIMARY KEY) - Auto-incrementing account ID
- `userId` (integer, NOT NULL, FOREIGN KEY) - References auth_users(id)
- `type` (varchar, NOT NULL) - Account type (e.g., 'credentials')
- `provider` (varchar, NOT NULL) - Provider name (e.g., 'credentials')
- `providerAccountId` (varchar, NOT NULL) - Provider-specific account ID
- `refresh_token` (text, nullable) - OAuth refresh token
- `access_token` (text, nullable) - OAuth access token
- `expires_at` (bigint, nullable) - Token expiration timestamp
- `id_token` (text, nullable) - OAuth ID token
- `scope` (text, nullable) - OAuth scope
- `session_state` (text, nullable) - OAuth session state
- `token_type` (text, nullable) - OAuth token type
- `password` (text, nullable) - **Hashed password for credentials provider**

**Constraints:**
- FOREIGN KEY: userId references auth_users(id) ON DELETE CASCADE

**Important Notes:**
- Passwords are stored here using **Argon2id** hashing algorithm
- Password format: `$argon2id$v=19$m=65536,t=3,p=4$[salt]$[hash]`
- For credentials-based authentication, type='credentials' and provider='credentials'

### auth_sessions
**Purpose:** Stores active user sessions

**Columns:**
- `id` (integer, PRIMARY KEY) - Auto-incrementing session ID
- `userId` (integer, NOT NULL, FOREIGN KEY) - References auth_users(id)
- `expires` (timestamp with time zone, NOT NULL) - Session expiration time
- `sessionToken` (varchar, NOT NULL) - Unique session token

**Constraints:**
- FOREIGN KEY: userId references auth_users(id) ON DELETE CASCADE

**Important Notes:**
- Column name is `sessionToken` (camelCase), not `session_token` (snake_case)
- Column name is `userId` (camelCase), not `user_id` (snake_case)

## Implementation Changes

### 1. Password Hashing
**Changed from:** bcrypt
**Changed to:** argon2

**Reason:** The database uses Argon2id for password hashing, which is more secure and modern than bcrypt.

**Package:** `argon2`

### 2. User ID Type
**Changed from:** string
**Changed to:** integer (converted to string for NextAuth compatibility)

**Reason:** The database uses integer IDs for users, not UUIDs or strings.

### 3. Authentication Flow
**Updated to:**
1. Query `auth_users` table by email
2. Query `auth_accounts` table to get password hash
3. Verify password using argon2.verify()
4. Create session in `auth_sessions` table with correct column names

### 4. Column Name Conventions
**Database uses camelCase for some columns:**
- `userId` (not `user_id`)
- `sessionToken` (not `session_token`)
- `emailVerified` (not `email_verified`)
- `providerAccountId` (not `provider_account_id`)

## Test Users

The database contains 4 test users:

1. **Admin User**
   - Email: admin@nas2.com
   - Role: leader
   - User ID: 1

2. **Sales User**
   - Email: sales@nas2.com
   - Role: sales
   - User ID: 2

3. **Engineer User**
   - Email: engineer@nas2.com
   - Role: engineer
   - User ID: 3

4. **Accounting User**
   - Email: accounting@nas2.com
   - Role: accounting
   - User ID: 4

## Connection Information

**Project ID:** misty-wave-96189879
**Project Name:** NAS2
**Region:** aws-us-east-1
**PostgreSQL Version:** 17

## All Tables in Database

1. auth_accounts
2. auth_sessions
3. auth_users
4. auth_verification_token
5. customers
6. invoice_line_items
7. invoices
8. material_request_items
9. material_requests
10. materials
11. migrations
12. project_costs
13. project_reports
14. projects
15. quotation_line_items
16. quotation_scope_work
17. quotations

## Next Steps

For future tasks, always verify the actual database schema using Neon MCP tools before implementing features. The schema may differ from documentation or assumptions.

**Recommended workflow:**
1. Use `get_database_tables` to list all tables
2. Use `describe_table_schema` to get detailed column information
3. Use `run_sql` to query sample data and understand relationships
4. Implement features based on actual schema, not assumptions
