-- InvoicePro Database Schema
-- PostgreSQL + Supabase

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,


CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  terms TEXT DEFAULT '',
  place_of_supply TEXT DEFAULT '',
  reverse_charge BOOLEAN DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- Invoice versions (audit trail)
CREATE TABLE IF NOT EXISTS invoice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  diff TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoice_versions_invoice_id ON invoice_versions(invoice_id);

-- RLS Policies (for Supabase)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_versions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON app_users FOR ALL USING (auth.uid() = id);
CREATE POLICY customers_policy ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY invoices_policy ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY invoice_versions_policy ON invoice_versions FOR ALL 
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_versions.invoice_id AND invoices.user_id = auth.uid()));
