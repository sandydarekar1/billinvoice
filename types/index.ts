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

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  legal_name: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logo_url: string;
  bank_name: string;
  bank_account_no: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  signature_url: string;
  invoice_prefix: string;
  invoice_footer: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billing_address?: string;
  shipping_address?: string;
  state?: string;
  opening_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  hsn_code: string;
  gst_rate: number;
  unit_price: number;
  unit: string;
  category: string;
  description: string;
  sku: string;
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
  invoice_type: "invoice" | "quotation" | "proforma" | "delivery_challan";
  items: InvoiceItem[];
  subtotal: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  terms?: string;
  place_of_supply?: string;
  reverse_charge: boolean;
  is_recurring: boolean;
  recurring_interval: "" | "weekly" | "monthly" | "quarterly" | "yearly";
  recurring_start?: string;
  recurring_end?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_mode: "cash" | "bank_transfer" | "upi" | "cheque" | "other";
  reference_no: string;
  notes: string;
  created_at: string;
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
  format: "json" | "csv" | "markdown" | "pdf";
  invoiceIds?: string[];
  dateRange?: { from: string; to: string };
}
