# Database Migration Scripts

This directory contains database migration scripts for the Marine Engineering Project Management System.

## Files

### `migrate.js`
Main migration script that:
- Connects to Neon PostgreSQL database
- Runs all pending migrations in order
- Tracks executed migrations to prevent duplicates
- Provides schema verification
- Handles errors gracefully with transaction rollback

## Usage

```bash
# Run all pending migrations
npm run migrate

# Verify database schema
npm run migrate:verify

# Get help
node scripts/migrate.js --help
```

## Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Transactional**: Each migration runs in a transaction
- ✅ **Tracked**: Prevents duplicate execution
- ✅ **Verified**: Checks schema after migration
- ✅ **Logged**: Detailed progress and error reporting
- ✅ **Graceful**: Handles connection errors and rollbacks

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string

## Error Handling

The script includes comprehensive error handling:
- Connection validation
- Transaction rollback on failure
- Detailed error logging
- Graceful process termination

## Migration Definitions

Migrations are defined in:
`../src/app/api/utils/migrations.js`

Each migration includes:
- Sequential ID
- Descriptive name  
- SQL statements
- Proper constraints and indexes

## Security

- Uses parameterized queries
- Validates environment variables
- Handles connection pooling properly
- Includes proper error boundaries

For detailed usage instructions, see `../MIGRATION.md`.