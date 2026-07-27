export interface User {
  id: string;
  email: string;
  name: string;
  company_name?: string;
  gstin?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billing_address?: string;
  shipping_address?: string;
  pan?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  total_tax: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  place_of_supply?: string;
  reverse_charge: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceVersion {
  id: string;
  invoice_id: string;
  version: number;
  snapshot: Invoice;
  diff?: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_invoices: number;
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  monthly_revenue: { month: string; revenue: number }[];
  top_customers: { name: string; total: number }[];
  status_breakdown: { status: string; count: number; amount: number }[];
}

export interface GSTSuggestions {
  hsnCode: string;
  description: string;
  gstRate: number;
  category: string;
}

export interface AnomalyResult {
  field: string;
  issue: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export interface OCRResult {
  invoice_number?: string;
  date?: string;
  vendor_name?: string;
  vendor_gstin?: string;
  total_amount?: number;
  tax_amount?: number;
  items?: { description: string; quantity: number; unit_price: number; total: number }[];
  confidence: number;
}

export interface AISettings {
  provider: "openai" | "anthropic" | "google";
  api_key: string;
  model: string;
  ocr_enabled: boolean;
}

export interface ExportOptions {
  format: "json" | "csv" | "markdown";
  invoiceIds?: string[];
  dateRange?: { from: string; to: string };
}
