import type { InvoiceItem, Invoice, AnomalyResult } from "@/types";

export function calculateItemTotal(item: Omit<InvoiceItem, "id" | "total" | "cgst" | "sgst" | "igst">): InvoiceItem {
  const lineTotal = +(item.quantity * item.unit_price).toFixed(2);
  const gstAmount = +(lineTotal * (item.gst_rate / 100)).toFixed(2);

  let cgst = 0, sgst = 0, igst = 0;

  cgst = +(gstAmount / 2).toFixed(2);
  sgst = +(gstAmount / 2).toFixed(2);

  return {
    id: crypto.randomUUID(),
    description: item.description,
    hsn_code: item.hsn_code,
    quantity: item.quantity,
    unit_price: item.unit_price,
    gst_rate: item.gst_rate,
    cgst,
    sgst,
    igst,
    total: +(lineTotal + gstAmount).toFixed(2),
  };
}

export function calculateInvoice(items: InvoiceItem[]): {
  subtotal: number;
  totalTax: number;
  totalAmount: number;
} {
  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
  const totalTax = items.reduce((sum, i) => sum + i.cgst + i.sgst + i.igst, 0);
  return {
    subtotal: +subtotal.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    totalAmount: +(subtotal + totalTax).toFixed(2),
  };
}

export function validateInvoice(invoice: Partial<Invoice>): string[] {
  const errors: string[] = [];
  if (!invoice.customer_id) errors.push("Customer is required");
  if (!invoice.invoice_date) errors.push("Invoice date is required");
  if (!invoice.items || invoice.items.length === 0) errors.push("At least one item is required");
  if (invoice.items) {
    invoice.items.forEach((item, i) => {
      if (!item.description) errors.push(`Item ${i + 1}: Description is required`);
      if (!item.hsn_code) errors.push(`Item ${i + 1}: HSN code is required`);
      if (item.quantity <= 0) errors.push(`Item ${i + 1}: Quantity must be > 0`);
      if (item.unit_price < 0) errors.push(`Item ${i + 1}: Unit price must be >= 0`);
      if (item.gst_rate < 0 || item.gst_rate > 28) errors.push(`Item ${i + 1}: Invalid GST rate`);
    });
  }
  return errors;
}

export function generateInvoiceNumber(lastNumber?: string): string {
  const prefix = "INV";
  if (!lastNumber) return `${prefix}-${String(1).padStart(6, "0")}`;
  const num = parseInt(lastNumber.split("-")[1] || "0", 10);
  return `${prefix}-${String(num + 1).padStart(6, "0")}`;
}

export function detectAnomalies(invoice: Partial<Invoice>, allInvoices: Invoice[]): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  if (invoice.total_amount && invoice.total_amount > 1000000) {
    anomalies.push({ field: "total_amount", issue: "Invoice amount exceeds ₹10,00,000", severity: "medium", suggestion: "Verify amount and consider adding supporting documents" });
  }

  if (invoice.items) {
    invoice.items.forEach((item) => {
      if (item.gst_rate === 0) {
        anomalies.push({ field: `items.hsn_code`, issue: `Item "${item.description}" has 0% GST`, severity: "low", suggestion: "Verify HSN code and GST rate" });
      }
      if (item.unit_price > 50000) {
        anomalies.push({ field: `items.unit_price`, issue: `Item "${item.description}" unit price exceeds ₹50,000`, severity: "medium", suggestion: "Verify pricing" });
      }
      if (item.quantity > 1000) {
        anomalies.push({ field: `items.quantity`, issue: `Item "${item.description}" quantity exceeds 1000`, severity: "low", suggestion: "Verify quantity" });
      }
    });
  }

  const customerInvoices = allInvoices.filter((i) => i.customer_id === invoice.customer_id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = customerInvoices.filter((i) => i.created_at > sevenDaysAgo);

  if (recent.length > 0) {
    const hasDuplicate = recent.some((i) =>
      i.total_amount === invoice.total_amount &&
      i.items?.length === invoice.items?.length
    );
    if (hasDuplicate) {
      anomalies.push({ field: "total_amount", issue: "Possible duplicate invoice detected", severity: "high", suggestion: "Check recent invoices for the same customer" });
    }
  }

  if ((invoice as any).customer_gstin) {
    const gstin = (invoice as any).customer_gstin;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gstin)) {
      anomalies.push({ field: "customer_gstin", issue: "Invalid GSTIN format", severity: "high", suggestion: "Check the GSTIN format (e.g., 27AABCU9603R1ZX)" });
    }
  }

  if (invoice.items) {
    const taxRates = invoice.items.map((i) => i.gst_rate).filter(Boolean);
    const hasMixed = taxRates.length > 1 && new Set(taxRates).size > 1;
    if (hasMixed) {
      anomalies.push({ field: "items", issue: "Mixed GST rates detected in same invoice", severity: "low", suggestion: "Items with different GST slab rates" });
    }
  }

  return anomalies;
}
