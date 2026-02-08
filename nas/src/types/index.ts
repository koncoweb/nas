// User and Authentication
export interface User {
  id: number;
  name: string;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  user_role: "leader" | "sales" | "accounting" | "engineer";
}

export interface AuthAccount {
  id: number;
  userId: number;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  id_token: string | null;
  scope: string | null;
  session_state: string | null;
  token_type: string | null;
  password: string | null;
}

export interface AuthSession {
  id: number;
  userId: number;
  expires: Date;
  sessionToken: string;
}

// Customer
export interface Customer {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

// Material
export interface Material {
  id: number;
  name: string;
  description: string | null;
  category: string;
  unit_type: string;
  unit_cost: number;
  supplier: string | null;
  part_number: string | null;
  created_at: Date;
  updated_at: Date;
}

// Quotation
export interface Quotation {
  id: number;
  quote_number: string;
  customer_id: number;
  title: string;
  description: string | null;
  labor_hours: number;
  labor_rate: number;
  materials_cost: number;
  labor_cost: number;
  total_cost: number;
  profit_margin: number;
  status: "draft" | "sent" | "approved" | "rejected";
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationLineItem {
  id: number;
  quotation_id: number;
  material_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuotationScopeWork {
  id: number;
  quotation_id: number;
  step_number: number;
  description: string;
  work_category: string | null;
}

// Project
export interface Project {
  id: number;
  project_number: string;
  quotation_id: number | null;
  customer_id: number;
  title: string;
  description: string | null;
  status: "planning" | "in_progress" | "completed";
  assigned_engineer: string | null;
  start_date: Date | null;
  expected_completion: Date | null;
  actual_completion: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Material Request
export interface MaterialRequest {
  id: number;
  project_id: number;
  requested_by: string;
  request_type: "purchase" | "warehouse";
  title: string;
  urgency: "low" | "medium" | "high";
  estimated_total_cost: number;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  created_at: Date;
  updated_at: Date;
}

export interface MaterialRequestItem {
  id: number;
  material_request_id: number;
  material_id: number | null;
  description: string;
  quantity: number;
  estimated_unit_cost: number;
}

// Project Cost
export interface ProjectCost {
  id: number;
  project_id: number;
  cost_type: "labor" | "materials" | "equipment" | "other";
  description: string;
  material_id: number | null;
  quantity: number | null;
  unit_cost: number | null;
  total_cost: number;
  vendor: string | null;
  cost_date: Date;
  created_at: Date;
}

// Invoice
export interface Invoice {
  id: number;
  invoice_number: string;
  project_id: number;
  customer_id: number;
  due_date: Date;
  total_amount: number;
  amount_paid?: number; // Calculated from payments
  status: "draft" | "sent" | "paid" | "pending" | "overdue" | "cancelled";
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

// Project Report
export interface ProjectReport {
  id: number;
  project_id: number;
  completion_date: Date;
  work_summary: string;
  materials_used: string;
  customer_signature_url: string | null;
  status: "draft" | "submitted" | "approved";
  created_at: Date;
  updated_at: Date;
}
