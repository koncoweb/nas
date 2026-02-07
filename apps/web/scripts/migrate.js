#!/usr/bin/env node

/**
 * Database migration script for Vercel deployment
 * This script runs all necessary database migrations for the Marine Engineering Project Management System
 * 
 * Usage:
 *   node scripts/migrate.js
 *   npm run migrate
 * 
 * Environment Variables Required:
 *   DATABASE_URL - Neon PostgreSQL connection string
 */

import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { migrations, getAllMigrationsSQL } from '../src/app/api/utils/migrations.js';

// Load environment variables
config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Create migrations table if it doesn't exist
    console.log('📋 Creating migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Migrations table ready');
    
    // Get already executed migrations
    const executedResult = await client.query(
      'SELECT name FROM migrations ORDER BY executed_at'
    );
    const executedMigrations = new Set(executedResult.rows.map(row => row.name));
    
    console.log(`📊 Found ${executedMigrations.size} previously executed migrations`);
    
    // Run pending migrations
    let executedCount = 0;
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.name)) {
        console.log(`⚡ Executing migration: ${migration.name}`);
        
        try {
          // Begin transaction
          await client.query('BEGIN');
          
          // Execute migration SQL
          await client.query(migration.sql);
          
          // Record migration as executed
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration.name]
          );
          
          // Commit transaction
          await client.query('COMMIT');
          
          console.log(`✅ Migration completed: ${migration.name}`);
          executedCount++;
        } catch (error) {
          // Rollback transaction on error
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed: ${migration.name}`);
          console.error('Error:', error.message);
          throw error;
        }
      } else {
        console.log(`⏭️  Skipping already executed migration: ${migration.name}`);
      }
    }
    
    // Release client
    client.release();
    
    if (executedCount > 0) {
      console.log(`🎉 Successfully executed ${executedCount} new migrations`);
    } else {
      console.log('✨ All migrations are up to date');
    }
    
    console.log('🏁 Migration process completed successfully');
    
  } catch (error) {
    console.error('❌ Migration process failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

/**
 * Verify database schema
 */
async function verifySchema() {
  console.log('🔍 Verifying database schema...');
  
  try {
    const client = await pool.connect();
    
    // Check if all required tables exist
    const requiredTables = [
      'auth_users',
      'customers', 
      'materials',
      'quotations',
      'quotation_line_items',
      'quotation_scope_work',
      'projects',
      'project_costs',
      'material_requests',
      'material_request_items',
      'invoices',
      'invoice_line_items',
      'project_reports'
    ];
    
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
    `;
    
    const result = await client.query(tableCheckQuery, [requiredTables]);
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log(`📊 Found ${existingTables.length}/${requiredTables.length} required tables`);
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Missing tables:', missingTables.join(', '));
    } else {
      console.log('✅ All required tables exist');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify') || args.includes('-v')) {
    await verifySchema();
    return;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Migration Script

Usage:
  node scripts/migrate.js [options]

Options:
  --verify, -v    Verify database schema without running migrations
  --help, -h      Show this help message

Environment Variables:
  DATABASE_URL    Neon PostgreSQL connection string (required)

Examples:
  node scripts/migrate.js           # Run migrations
  node scripts/migrate.js --verify  # Verify schema only
    `);
    return;
  }
  
  // Run migrations by default
  await runMigrations();
  
  // Verify schema after migrations
  await verifySchema();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
});