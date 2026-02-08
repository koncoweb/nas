# Database Guidelines

## Neon PostgreSQL Database

Both implementations use **Neon PostgreSQL** - a serverless Postgres platform with database branching, autoscaling, and scale-to-zero capabilities.

## Using Kiro Power Neon MCP

**IMPORTANT:** For all database-related work, use the **Neon Power** via Kiro Powers to interact with the database directly.

### When to Use Neon Power

Use Neon Power for:
- ✅ Getting accurate database schema information
- ✅ Creating or modifying tables and columns
- ✅ Running SQL queries to inspect data
- ✅ Testing schema changes safely with database branching
- ✅ Creating migrations
- ✅ Verifying database structure
- ✅ Debugging database issues
- ✅ Setting up new database projects

### Activation

Before using any Neon tools, always activate the power first:

```
Action: activate
Power: neon
```

This provides access to all available tools and their schemas.

### Key Neon Power Tools

#### 1. Schema Inspection

**get_database_tables** - List all tables in the database
```javascript
{
  "projectId": "your-project-id",
  "databaseName": "neondb"  // optional, defaults to neondb
}
```

**describe_table_schema** - Get detailed schema for a specific table
```javascript
{
  "tableName": "customers",
  "projectId": "your-project-id",
  "databaseName": "neondb"
}
```

#### 2. Running SQL Queries

**run_sql** - Execute a single SQL statement
```javascript
{
  "sql": "SELECT * FROM customers WHERE status = 'active'",
  "projectId": "your-project-id",
  "databaseName": "neondb"
}
```

**run_sql_transaction** - Execute multiple SQL statements in a transaction
```javascript
{
  "sqlStatements": [
    "INSERT INTO customers (name, email) VALUES ('John', 'john@example.com')",
    "UPDATE projects SET customer_id = LAST_INSERT_ID() WHERE id = 1"
  ],
  "projectId": "your-project-id"
}
```

#### 3. Safe Schema Migrations with Branching

**prepare_database_migration** - Create migration in a temporary branch
```javascript
{
  "migrationSql": "ALTER TABLE customers ADD COLUMN phone VARCHAR(20)",
  "projectId": "your-project-id",
  "databaseName": "neondb"
}
```

This tool:
1. Creates a temporary branch
2. Applies the migration SQL to that branch
3. Returns migration details for verification

**After verification, use:**

**complete_database_migration** - Apply migration to main branch
```javascript
{
  "migrationId": "migration-id-from-prepare",
  "migrationSql": "ALTER TABLE customers ADD COLUMN phone VARCHAR(20)",
  "databaseName": "neondb",
  "projectId": "your-project-id",
  "temporaryBranchId": "br-temp-123",
  "parentBranchId": "br-main",
  "applyChanges": true  // or false to discard
}
```

#### 4. Query Performance Tuning

**prepare_query_tuning** - Analyze and optimize slow queries
```javascript
{
  "sql": "SELECT * FROM quotations WHERE status = 'pending' AND created_at > '2024-01-01'",
  "databaseName": "neondb",
  "projectId": "your-project-id"
}
```

This tool:
1. Creates a temporary branch
2. Analyzes query execution plan
3. Suggests optimizations (indexes, query rewrites)
4. Returns tuning recommendations

**complete_query_tuning** - Apply performance improvements
```javascript
{
  "tuningId": "tuning-id-from-prepare",
  "suggestedSqlStatements": ["CREATE INDEX idx_quotations_status ON quotations(status)"],
  "databaseName": "neondb",
  "projectId": "your-project-id",
  "temporaryBranchId": "br-temp-456",
  "applyChanges": true
}
```

#### 5. Project Management

**list_projects** - List all Neon projects
```javascript
{
  "limit": 10,
  "search": "marine"  // optional filter
}
```

**describe_project** - Get project details
```javascript
{
  "projectId": "your-project-id"
}
```

**get_connection_string** - Get database connection string
```javascript
{
  "projectId": "your-project-id",
  "branchId": "br-main",  // optional
  "databaseName": "neondb"  // optional
}
```

## Database Schema Overview

### Authentication Tables
- `auth_users` - User accounts with roles
- `auth_accounts` - Password storage (Argon2 hashed)
- `auth_sessions` - Active user sessions

### Core Business Tables
- `customers` - Customer information and contacts
- `materials` - Materials catalog with pricing
- `quotations` - Price quotations
- `quotation_line_items` - Line items for quotations
- `quotation_scope_work` - Scope of work details
- `projects` - Project tracking
- `material_requests` - Material request workflows
- `material_request_items` - Items in material requests
- `invoices` - Customer invoices
- `invoice_line_items` - Invoice line items
- `payments` - Payment tracking
- `project_costs` - Project expense tracking
- `project_reports` - Completion reports

### Common Columns
- `id` - Primary key (SERIAL or INTEGER)
- `created_at` - Timestamp (default NOW())
- `updated_at` - Timestamp (updated on change)
- `created_by` - User ID who created the record
- `status` - Status field (varies by table)

## Workflow: Schema Changes

### Step 1: Inspect Current Schema
```
Use: describe_table_schema
Purpose: Understand current table structure before making changes
```

### Step 2: Prepare Migration
```
Use: prepare_database_migration
Purpose: Create migration in temporary branch for testing
Result: Migration ID, temporary branch ID
```

### Step 3: Verify Changes
```
Use: run_sql (with branchId from step 2)
Purpose: Test queries on the temporary branch
Example: SELECT column_name FROM information_schema.columns WHERE table_name = 'customers'
```

### Step 4: Apply or Discard
```
Use: complete_database_migration
Purpose: Apply to main branch if tests pass, or discard if issues found
```

## Workflow: Query Optimization

### Step 1: Identify Slow Query
```
Use: list_slow_queries
Purpose: Find queries that need optimization
```

### Step 2: Analyze Query
```
Use: prepare_query_tuning
Purpose: Get optimization suggestions (indexes, rewrites)
Result: Tuning ID, suggested improvements
```

### Step 3: Test Improvements
```
Use: run_sql (on temporary branch)
Purpose: Apply suggested indexes and test performance
```

### Step 4: Apply Optimizations
```
Use: complete_query_tuning
Purpose: Apply improvements to main branch
```

## Best Practices

### Always Use Neon Power For:
1. **Schema Discovery** - Get accurate table structures before coding
2. **Schema Changes** - Use branching to test migrations safely
3. **Data Inspection** - Query database to understand data patterns
4. **Performance Issues** - Analyze and optimize slow queries
5. **Debugging** - Verify data integrity and relationships

### Database Branching Benefits:
- **Safe Testing** - Test schema changes without affecting production
- **Rollback Capability** - Discard changes if issues arise
- **Parallel Development** - Multiple developers can work on separate branches
- **Zero Downtime** - Apply tested changes confidently

### Security Reminders:
- **Never expose** `DATABASE_URL` in client-side code
- **Always use** parameterized queries (SQL template literals)
- **Validate input** before database operations
- **Use transactions** for multi-step operations
- **Hash passwords** with Argon2 (already implemented)

## Connection String Format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Stored in:
- **nas/**: `.env.local` as `DATABASE_URL`
- **apps/web/**: `.env` as `DATABASE_URL`

## Common Database Operations

### Check Table Exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'customers'
);
```

### Get Column Information
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

### Check Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'customers';
```

### View Foreign Keys
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'quotations';
```

## Troubleshooting

### "Cannot connect to database"
1. Use `get_connection_string` to get fresh connection string
2. Verify `DATABASE_URL` in environment variables
3. Check Neon project status in console

### "Table does not exist"
1. Use `get_database_tables` to list all tables
2. Verify table name spelling and case sensitivity
3. Check if migrations have been run

### "Column does not exist"
1. Use `describe_table_schema` to see current columns
2. Check if migration was applied successfully
3. Verify column name in query matches schema

### "Slow query performance"
1. Use `list_slow_queries` to identify problematic queries
2. Use `prepare_query_tuning` to get optimization suggestions
3. Apply recommended indexes with `complete_query_tuning`

## Migration Naming Convention

Use descriptive names for migrations:
- ✅ `add_phone_column_to_customers`
- ✅ `create_project_reports_table`
- ✅ `add_index_on_quotations_status`
- ❌ `migration_001`
- ❌ `update_table`

## Remember

**Before writing any database-related code:**
1. Activate Neon Power
2. Use `describe_table_schema` to get accurate schema
3. Use `run_sql` to test queries
4. Use branching for schema changes
5. Verify changes before applying to main branch

This ensures code matches the actual database structure and prevents runtime errors.
