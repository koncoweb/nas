# Database Migration Guide

This guide explains how to run database migrations for the Marine Engineering Project Management System.

## Overview

The migration system uses a custom Node.js script that connects to your Neon PostgreSQL database and runs all necessary schema migrations in order. Each migration is tracked to ensure it only runs once.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Neon PostgreSQL Database** 
3. **Environment Variables** configured

## Environment Setup

Create a `.env` file in the `apps/web` directory with your database connection:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

For Neon databases, your connection string should look like:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Running Migrations

### 1. Install Dependencies

```bash
cd apps/web
npm install
```

### 2. Run All Migrations

```bash
# Using npm script (recommended)
npm run migrate

# Or directly with node
node scripts/migrate.js
```

### 3. Verify Database Schema

```bash
# Check if all tables exist
npm run migrate:verify

# Or directly
node scripts/migrate.js --verify
```

### 4. Get Help

```bash
node scripts/migrate.js --help
```

## Migration Process

The migration script will:

1. **Connect to Database** - Test the connection to your Neon database
2. **Create Migration Table** - Creates a `migrations` table to track executed migrations
3. **Check Executed Migrations** - Queries which migrations have already been run
4. **Run Pending Migrations** - Executes any new migrations in order
5. **Verify Schema** - Checks that all required tables exist

## Migration Output

Successful migration output looks like:
```
🚀 Starting database migrations...
📡 Testing database connection...
✅ Database connection successful
📋 Creating migrations table...
✅ Migrations table ready
📊 Found 0 previously executed migrations
⚡ Executing migration: enable_extensions
✅ Migration completed: enable_extensions
⚡ Executing migration: create_auth_tables
✅ Migration completed: create_auth_tables
...
🎉 Successfully executed 16 new migrations
🔍 Verifying database schema...
📊 Found 13/13 required tables
✅ All required tables exist
🏁 Migration process completed successfully
```

## Database Schema

The migrations create the following tables:

### Authentication Tables
- `auth_users` - User accounts and roles
- `auth_accounts` - OAuth provider accounts
- `auth_sessions` - User sessions
- `auth_verification_token` - Email verification tokens

### Core Business Tables
- `customers` - Customer information
- `materials` - Materials catalog
- `quotations` - Price quotations
- `quotation_line_items` - Quotation line items
- `quotation_scope_work` - Scope of work items
- `projects` - Project management
- `material_requests` - Material request workflow
- `material_request_items` - Individual requested items
- `project_costs` - Project expenses tracking
- `invoices` - Invoice generation
- `invoice_line_items` - Invoice line items
- `project_reports` - Completion reports

### System Tables
- `company_settings` - Application configuration
- `migrations` - Migration tracking

## Troubleshooting

### Connection Issues

**Error**: `❌ DATABASE_URL environment variable is required`
- **Solution**: Make sure your `.env` file exists and contains a valid `DATABASE_URL`

**Error**: `Connection failed`
- **Solution**: Check your database connection string and ensure the database is accessible

### Migration Failures

**Error**: `Migration failed: create_xxx_table`
- **Solution**: Check the error details. Often caused by:
  - Existing tables with different schema
  - Permission issues
  - Network connectivity problems

**Recovery**: The migration system uses transactions, so failed migrations are automatically rolled back. Fix the issue and re-run the migration.

### Schema Verification Issues

**Warning**: `⚠️ Missing tables: table_name`
- **Solution**: This usually means a migration didn't complete successfully. Check the migration logs and re-run migrations.

## Manual Database Reset

If you need to completely reset your database:

```sql
-- Connect to your database and run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO your_username;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run migrations:
```bash
npm run migrate
```

## Development vs Production

### Development
- Run migrations locally against your development database
- Safe to reset and re-run migrations during development

### Production
- **ALWAYS** backup your database before running migrations
- Test migrations on a staging environment first
- Migrations are designed to be safe and non-destructive
- The script will skip already-executed migrations

## Migration Files

Migration definitions are located in:
- `apps/web/src/app/api/utils/migrations.js`

Each migration includes:
- **ID**: Unique sequential number
- **Name**: Descriptive name
- **SQL**: The actual migration SQL

## Adding New Migrations

To add a new migration:

1. Edit `apps/web/src/app/api/utils/migrations.js`
2. Add a new migration object to the `migrations` array
3. Use the next sequential ID number
4. Test the migration locally
5. Deploy and run in production

Example:
```javascript
{
  id: 17,
  name: "add_new_feature_table",
  sql: `
    CREATE TABLE IF NOT EXISTS new_feature (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
}
```

## Best Practices

1. **Always use `IF NOT EXISTS`** for CREATE statements
2. **Use transactions** for complex migrations
3. **Test migrations locally** before production
4. **Backup production data** before major migrations
5. **Make migrations idempotent** (safe to run multiple times)
6. **Use proper data types** and constraints
7. **Add indexes** for performance-critical queries

## Support

If you encounter issues with migrations:

1. Check the error logs for specific details
2. Verify your database connection and permissions
3. Ensure your Neon database is accessible
4. Check that all required environment variables are set
5. Try running migrations with `--verify` flag to check schema state