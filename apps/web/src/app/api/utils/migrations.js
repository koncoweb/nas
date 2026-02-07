/**
 * Database Migration Script
 * Complete schema for Marine Engineering Project Management System
 *
 * This file contains all database migrations in order.
 * Each migration should be idempotent (safe to run multiple times).
 */

export const migrations = [
  // Migration 1: Enable required extensions
  {
    id: 1,
    name: "enable_extensions",
    sql: `
      -- Enable pg_trgm extension for fuzzy text search
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `,
  },

  // Migration 2: Create auth tables
  {
    id: 2,
    name: "create_auth_tables",
    sql: `
      -- Users table
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        "emailVerified" TIMESTAMPTZ,
        image TEXT,
        user_role VARCHAR(20) DEFAULT 'sales' CHECK (
          user_role IN ('leader', 'sales', 'accounting', 'engineer')
        )
      );

      -- Accounts table for authentication providers
      CREATE TABLE IF NOT EXISTS auth_accounts (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        "providerAccountId" VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        id_token TEXT,
        scope TEXT,
        session_state TEXT,
        token_type TEXT,
        password TEXT
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL,
        "sessionToken" VARCHAR(255) NOT NULL
      );

      -- Verification tokens
      CREATE TABLE IF NOT EXISTS auth_verification_token (
        identifier TEXT NOT NULL,
        expires TIMESTAMPTZ NOT NULL,
        token TEXT NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `,
  },

  // Migration 3: Create customers table
  {
    id: 3,
    name: "create_customers_table",
    sql: `
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },

  // Migration 4: Create materials table
  {
    id: 4,
    name: "create_materials_table",
    sql: `
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        unit_type VARCHAR(50),
        unit_cost NUMERIC(12,2) DEFAULT 0 CHECK (unit_cost >= 0),
        supplier VARCHAR(255),
        part_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for materials search
      CREATE INDEX IF NOT EXISTS idx_materials_name_trgm 
        ON materials USING gin (name gin_trgm_ops);
      
      CREATE INDEX IF NOT EXISTS idx_materials_lower_name_trgm 
        ON materials USING gin (lower(name) gin_trgm_ops);
      
      CREATE INDEX IF NOT EXISTS idx_materials_part_number 
        ON materials (part_number);
    `,
  },

  // Migration 5: Create quotations tables
  {
    id: 5,
    name: "create_quotations_tables",
    sql: `
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        quote_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES auth_users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        service_type VARCHAR(100),
        labor_hours NUMERIC(15,2) DEFAULT 0,
        labor_rate NUMERIC(15,2) DEFAULT 0,
        labor_cost NUMERIC(15,2) DEFAULT 0,
        materials_cost NUMERIC(15,2) DEFAULT 0,
        total_cost NUMERIC(15,2) DEFAULT 0,
        profit_margin NUMERIC(5,2) DEFAULT 0,
        final_price NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' CHECK (
          status IN ('draft', 'sent', 'approved', 'rejected', 'expired')
        ),
        valid_until DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vessel_name VARCHAR(255),
        location VARCHAR(500),
        revision_number INTEGER DEFAULT 0,
        time_estimation_supply VARCHAR(100),
        time_estimation_work VARCHAR(100),
        payment_percentage NUMERIC(5,2) DEFAULT 100.00,
        payment_timing VARCHAR(100) DEFAULT 'Upon work completion',
        validity_days INTEGER DEFAULT 7,
        other_terms TEXT,
        currency VARCHAR(3) DEFAULT 'IDR'
      );

      CREATE TABLE IF NOT EXISTS quotation_line_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
        material_id INTEGER REFERENCES materials(id),
        description TEXT NOT NULL,
        quantity NUMERIC(15,2) DEFAULT 1,
        unit_type VARCHAR(50),
        unit_price NUMERIC(15,2) DEFAULT 0,
        line_total NUMERIC(15,2) DEFAULT 0,
        line_order INTEGER DEFAULT 1,
        item_type VARCHAR(20) DEFAULT 'material' CHECK (
          item_type IN ('material', 'service', 'consumable', 'other')
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scope_group VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS quotation_scope_work (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
        step_number INTEGER,
        description TEXT NOT NULL,
        work_category VARCHAR(50),
        estimated_hours NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_quotations_customer 
        ON quotations(customer_id);
      
      CREATE INDEX IF NOT EXISTS idx_quotations_status 
        ON quotations(status);
    `,
  },

  // Migration 6: Create projects table
  {
    id: 6,
    name: "create_projects_table",
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_number VARCHAR(50) NOT NULL UNIQUE,
        quotation_id INTEGER REFERENCES quotations(id),
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'planning' CHECK (
          status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')
        ),
        assigned_engineer INTEGER REFERENCES auth_users(id),
        start_date DATE,
        expected_completion DATE,
        actual_completion DATE,
        priority VARCHAR(10) DEFAULT 'medium' CHECK (
          priority IN ('low', 'medium', 'high', 'urgent')
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_projects_customer 
        ON projects(customer_id);
      
      CREATE INDEX IF NOT EXISTS idx_projects_status 
        ON projects(status);
      
      CREATE INDEX IF NOT EXISTS idx_projects_assigned_engineer 
        ON projects(assigned_engineer);
    `,
  },

  // Migration 7: Create material requests tables
  {
    id: 7,
    name: "create_material_requests_tables",
    sql: `
      CREATE TABLE IF NOT EXISTS material_requests (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        requested_by INTEGER REFERENCES auth_users(id),
        request_type VARCHAR(20) DEFAULT 'material' CHECK (
          request_type IN ('material', 'operational_cost')
        ),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        urgency VARCHAR(20) DEFAULT 'medium' CHECK (
          urgency IN ('low', 'medium', 'high', 'urgent')
        ),
        estimated_total_cost NUMERIC(12,2) DEFAULT 0 CHECK (estimated_total_cost >= 0),
        request_date DATE DEFAULT CURRENT_DATE,
        needed_date DATE,
        status VARCHAR(20) DEFAULT 'draft' CHECK (
          status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled')
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS material_request_items (
        id SERIAL PRIMARY KEY,
        material_request_id INTEGER REFERENCES material_requests(id) ON DELETE CASCADE,
        material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        quantity NUMERIC(12,2) DEFAULT 1 CHECK (quantity >= 0),
        unit_type VARCHAR(50) DEFAULT 'Unit',
        estimated_unit_cost NUMERIC(12,2) DEFAULT 0 CHECK (estimated_unit_cost >= 0),
        estimated_total_cost NUMERIC(12,2) DEFAULT 0 CHECK (estimated_total_cost >= 0),
        purpose TEXT,
        is_urgent BOOLEAN DEFAULT false,
        item_order INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_mr_project 
        ON material_requests(project_id);
      
      CREATE INDEX IF NOT EXISTS idx_mr_requested_by 
        ON material_requests(requested_by);
      
      CREATE INDEX IF NOT EXISTS idx_mr_status 
        ON material_requests(status);
      
      CREATE INDEX IF NOT EXISTS idx_mri_request 
        ON material_request_items(material_request_id);
      
      CREATE INDEX IF NOT EXISTS idx_mri_material 
        ON material_request_items(material_id);
    `,
  },

  // Migration 8: Create approval workflows table
  {
    id: 8,
    name: "create_approval_workflows_table",
    sql: `
      CREATE TABLE IF NOT EXISTS approval_workflows (
        id SERIAL PRIMARY KEY,
        material_request_id INTEGER REFERENCES material_requests(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        approver_role VARCHAR(20) NOT NULL,
        approver_id INTEGER REFERENCES auth_users(id),
        status VARCHAR(20) DEFAULT 'pending' CHECK (
          status IN ('pending', 'approved', 'rejected', 'skipped')
        ),
        comments TEXT,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create unique index to prevent duplicate steps
      CREATE UNIQUE INDEX IF NOT EXISTS approval_workflows_request_step_unique 
        ON approval_workflows(material_request_id, step_order);
    `,
  },

  // Migration 9: Create project costs and labor tables
  {
    id: 9,
    name: "create_project_costs_tables",
    sql: `
      CREATE TABLE IF NOT EXISTS project_costs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        cost_type VARCHAR(20) CHECK (
          cost_type IN ('labor', 'material', 'equipment', 'subcontractor', 'travel', 'other')
        ),
        description TEXT NOT NULL,
        material_id INTEGER REFERENCES materials(id),
        quantity NUMERIC(12,2) DEFAULT 1,
        unit_cost NUMERIC(12,2) DEFAULT 0,
        total_cost NUMERIC(12,2) DEFAULT 0,
        purchase_date DATE DEFAULT CURRENT_DATE,
        vendor VARCHAR(255),
        receipt_number VARCHAR(100),
        created_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        material_request_id INTEGER REFERENCES material_requests(id),
        approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
          approval_status IN ('pending', 'approved', 'rejected')
        ),
        approved_by INTEGER REFERENCES auth_users(id),
        approved_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_labor (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        worker_id INTEGER REFERENCES auth_users(id),
        work_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        hours_worked NUMERIC(12,2) DEFAULT 0,
        hourly_rate NUMERIC(12,2) DEFAULT 0,
        total_cost NUMERIC(12,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_project_costs_project 
        ON project_costs(project_id);
    `,
  },

  // Migration 10: Create invoices and payments tables
  {
    id: 10,
    name: "create_invoices_tables",
    sql: `
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        project_id INTEGER REFERENCES projects(id),
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        issue_date DATE DEFAULT CURRENT_DATE,
        due_date DATE,
        subtotal NUMERIC(12,2) DEFAULT 0,
        tax_rate NUMERIC(5,2) DEFAULT 0,
        tax_amount NUMERIC(12,2) DEFAULT 0,
        total_amount NUMERIC(12,2) DEFAULT 0,
        amount_paid NUMERIC(12,2) DEFAULT 0,
        balance_due NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' CHECK (
          status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')
        ),
        payment_terms VARCHAR(50) DEFAULT 'Net 30',
        notes TEXT,
        created_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoice_line_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity NUMERIC(12,2) DEFAULT 1,
        unit_price NUMERIC(12,2) DEFAULT 0,
        line_total NUMERIC(12,2) DEFAULT 0,
        line_order INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        payment_date DATE DEFAULT CURRENT_DATE,
        payment_method VARCHAR(50),
        reference_number VARCHAR(100),
        notes TEXT,
        created_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_invoices_customer 
        ON invoices(customer_id);
      
      CREATE INDEX IF NOT EXISTS idx_invoices_status 
        ON invoices(status);
      
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date 
        ON invoices(due_date);
    `,
  },

  // Migration 11: Create project reports table
  {
    id: 11,
    name: "create_project_reports_table",
    sql: `
      CREATE TABLE IF NOT EXISTS project_reports (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES auth_users(id),
        completion_date DATE DEFAULT CURRENT_DATE,
        customer_signature_url TEXT,
        customer_signed_date DATE,
        work_summary TEXT,
        materials_used TEXT,
        recommendations TEXT,
        customer_feedback TEXT,
        issues_encountered TEXT,
        photos_urls TEXT[],
        status VARCHAR(20) DEFAULT 'pending' CHECK (
          status IN ('pending', 'customer_signed', 'completed')
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        report_type VARCHAR(20) DEFAULT 'work_done' CHECK (
          report_type IN ('work_done', 'delivery_order')
        ),
        delivery_number VARCHAR(50),
        delivered_date DATE,
        delivery_items TEXT,
        delivery_notes TEXT
      );
    `,
  },

  // Migration 12: Create company settings table
  {
    id: 12,
    name: "create_company_settings_table",
    sql: `
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },

  // Migration 13: Create database functions
  {
    id: 13,
    name: "create_database_functions",
    sql: `
      -- Function to update updated_at column
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to set material request item estimated total cost
      CREATE OR REPLACE FUNCTION set_mri_estimated_total_cost()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.quantity := COALESCE(NEW.quantity, 0);
        NEW.estimated_unit_cost := COALESCE(NEW.estimated_unit_cost, 0);
        NEW.estimated_total_cost := ROUND(NEW.quantity * NEW.estimated_unit_cost, 2);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to refresh material request total cost
      CREATE OR REPLACE FUNCTION refresh_mr_total_cost()
      RETURNS TRIGGER AS $$
      DECLARE
        mr_id INTEGER;
      BEGIN
        mr_id := COALESCE(NEW.material_request_id, OLD.material_request_id);
        IF mr_id IS NULL THEN
          RETURN NULL;
        END IF;

        UPDATE material_requests mr
        SET estimated_total_cost = COALESCE((
          SELECT ROUND(SUM(COALESCE(estimated_total_cost,0)),2)
          FROM material_request_items
          WHERE material_request_id = mr_id
        ), 0),
        updated_at = CURRENT_TIMESTAMP
        WHERE mr.id = mr_id;

        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },

  // Migration 14: Create triggers
  {
    id: 14,
    name: "create_triggers",
    sql: `
      -- Trigger for material_request_items to set total cost
      DROP TRIGGER IF EXISTS mri_set_total_cost ON material_request_items;
      CREATE TRIGGER mri_set_total_cost
        BEFORE INSERT OR UPDATE ON material_request_items
        FOR EACH ROW EXECUTE FUNCTION set_mri_estimated_total_cost();

      -- Trigger for material_request_items to refresh MR total
      DROP TRIGGER IF EXISTS mri_refresh_mr_total ON material_request_items;
      CREATE TRIGGER mri_refresh_mr_total
        AFTER INSERT OR UPDATE OR DELETE ON material_request_items
        FOR EACH ROW EXECUTE FUNCTION refresh_mr_total_cost();

      -- Triggers for updated_at columns
      DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
      CREATE TRIGGER update_materials_updated_at
        BEFORE UPDATE ON materials
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_material_requests_updated_at ON material_requests;
      CREATE TRIGGER update_material_requests_updated_at
        BEFORE UPDATE ON material_requests
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_material_request_items_updated_at ON material_request_items;
      CREATE TRIGGER update_material_request_items_updated_at
        BEFORE UPDATE ON material_request_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_project_costs_updated_at ON project_costs;
      CREATE TRIGGER update_project_costs_updated_at
        BEFORE UPDATE ON project_costs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `,
  },

  // Migration 15: Insert default company settings
  {
    id: 15,
    name: "insert_default_settings",
    sql: `
      INSERT INTO company_settings (setting_key, setting_value)
      VALUES 
        ('company_name', 'PT Marine Engineering Solutions'),
        ('company_address', 'Jl. Pelabuhan No. 123, Jakarta'),
        ('company_phone', '+62 21 1234567'),
        ('company_email', 'info@marineeng.com'),
        ('quote_prefix', 'QT'),
        ('invoice_prefix', 'INV'),
        ('project_prefix', 'PRJ'),
        ('default_tax_rate', '11')
      ON CONFLICT (setting_key) DO NOTHING;
    `,
  },

  // Migration 16: Fix foreign key constraints - make created_by nullable
  {
    id: 16,
    name: "fix_created_by_nullable",
    sql: `
      -- Make created_by nullable in quotations
      -- This prevents foreign key errors when user doesn't exist yet
      ALTER TABLE quotations 
        ALTER COLUMN created_by DROP NOT NULL;

      -- Make created_by nullable in invoices
      ALTER TABLE invoices 
        ALTER COLUMN created_by DROP NOT NULL;

      -- Make created_by nullable in project_reports
      ALTER TABLE project_reports 
        ALTER COLUMN created_by DROP NOT NULL;

      -- Make created_by nullable in project_costs
      ALTER TABLE project_costs 
        ALTER COLUMN created_by DROP NOT NULL;

      -- Make created_by nullable in payments
      ALTER TABLE payments 
        ALTER COLUMN created_by DROP NOT NULL;
    `,
  },
];

/**
 * Get all migrations SQL as a single string
 */
export function getAllMigrationsSQL() {
  return migrations
    .map((m) => `-- Migration ${m.id}: ${m.name}\n${m.sql}`)
    .join("\n\n");
}

/**
 * Get migrations from a specific ID onwards
 */
export function getMigrationsFrom(fromId) {
  return migrations.filter((m) => m.id >= fromId);
}
