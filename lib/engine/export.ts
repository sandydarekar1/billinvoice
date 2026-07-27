import type { Invoice } from "@/types";

export function exportToJSON(invoices: Invoice[]): string {
  return JSON.stringify(invoices.map(({ version, ...rest }) => rest), null, 2);
}

export function exportToCSV(invoices: Invoice[]): string {
  const headers = [
    "Invoice Number", "Date", "Customer", "Subtotal", "Total Tax",
    "Total Amount", "Status", "Items Count"
  ];
  const rows = invoices.map((inv) => [
    inv.invoice_number,
    inv.invoice_date,
    inv.customer_id,
    inv.subtotal.toFixed(2),
    inv.total_tax.toFixed(2),
    inv.total_amount.toFixed(2),
    inv.status,
    inv.items.length.toString(),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportToMarkdown(invoices: Invoice[]): string {
  const lines: string[] = ["# InvoicePro Export", "", `Exported: ${new Date().toISOString()}`, "", "---", ""];
  for (const inv of invoices) {
    lines.push(`## ${inv.invoice_number}`);
    lines.push(`- **Date:** ${inv.invoice_date}`);
    lines.push(`- **Status:** ${inv.status}`);
    lines.push(`- **Subtotal:** ₹${inv.subtotal.toFixed(2)}`);
    lines.push(`- **Tax:** ₹${inv.total_tax.toFixed(2)}`);
    lines.push(`- **Total:** ₹${inv.total_amount.toFixed(2)}`);
    lines.push("");
    lines.push("| # | Description | HSN | Qty | Unit Price | GST% | Total |");
    lines.push("|---|-------------|-----|-----|------------|------|-------|");
    inv.items.forEach((item, i) => {
      lines.push(`| ${i + 1} | ${item.description} | ${item.hsn_code} | ${item.quantity} | ₹${item.unit_price.toFixed(2)} | ${item.gst_rate}% | ₹${item.total.toFixed(2)} |`);
    });
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

export function exportInvoices(invoices: Invoice[], format: "json" | "csv" | "markdown"): string {
  switch (format) {
    case "json": return exportToJSON(invoices);
    case "csv": return exportToCSV(invoices);
    case "markdown": return exportToMarkdown(invoices);
  }
}

export function generateDiff(prev: Invoice, current: Invoice): string {
  const changes: string[] = [];
  if (prev.total_amount !== current.total_amount) {
    changes.push(`Total changed: ₹${prev.total_amount} → ₹${current.total_amount}`);
  }
  if (prev.status !== current.status) {
    changes.push(`Status changed: ${prev.status} → ${current.status}`);
  }
  if (prev.items.length !== current.items.length) {
    changes.push(`Items count changed: ${prev.items.length} → ${current.items.length}`);
  }
  if (prev.notes !== current.notes) {
    changes.push("Notes were modified");
  }
  return changes.join("; ") || "No significant changes";
}
