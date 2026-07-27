"use client";

import { useCallback } from "react";
import jsPDF from "jspdf";
import type { Invoice } from "@/types";

export function generateInvoicePDF(invoice: Invoice & { customer?: any; businessProfile?: any }) {
  const doc = new jsPDF("p", "mm", "a4");
  const bp = invoice.businessProfile || {};
  const cust = invoice.customer || {};
  let y = 15;

  const addText = (text: string, x: number, fontSize = 10, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.text(text, x, y);
    y += fontSize * 0.4;
  };

  const addLine = (left: string, right: string) => {
    y += 2;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(left, 15, y);
    doc.text(String(right), 195, y, { align: "right" });
    y += 6;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(bp.company_name || "InvoicePro", 15, y);
  y += 8;

  if (bp.address) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(bp.address, 15, y);
    y += 4;
  }
  if (bp.gstin) { doc.text(`GSTIN: ${bp.gstin}`, 15, y); y += 4; }
  if (bp.phone) { doc.text(`Phone: ${bp.phone}`, 15, y); y += 4; }
  if (bp.email) { doc.text(`Email: ${bp.email}`, 15, y); y += 4; }

  y += 5;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const typeLabel = invoice.invoice_type === "quotation" ? "QUOTATION" : invoice.invoice_type === "proforma" ? "PROFORMA INVOICE" : "TAX INVOICE";
  doc.text(typeLabel, 200, y, { align: "right" });
  y += 8;

  // Invoice details
  addLine("Invoice No:", invoice.invoice_number);
  addLine("Date:", invoice.invoice_date);
  addLine("Due Date:", invoice.due_date);
  if (bp.place_of_supply || invoice.place_of_supply) addLine("Place of Supply:", invoice.place_of_supply || bp.state || "");

  y += 3;

  // Bill To
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 15, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(cust.name || "", 15, y); y += 5;
  if (cust.billing_address) { doc.text(cust.billing_address, 15, y); y += 5; }
  if (cust.gstin) { doc.text(`GSTIN: ${cust.gstin}`, 15, y); y += 5; }
  if (cust.phone) { doc.text(`Phone: ${cust.phone}`, 15, y); y += 5; }

  y += 5;

  // Items table
  const tableTop = y;
  const colWidths = [85, 20, 20, 25, 25];
  const headers = ["Description", "HSN", "Qty", "Rate", "Amount"];

  doc.setFillColor(240, 240, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  let xPos = 15;
  headers.forEach((h, i) => {
    doc.rect(xPos, y, colWidths[i], 7, "F");
    doc.text(h, xPos + 1, y + 5);
    xPos += colWidths[i];
  });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  (invoice.items || []).forEach((item: any) => {
    const lineTotal = item.quantity * item.unit_price;
    const lines = doc.splitTextToSize(item.description || "", colWidths[0] - 2);
    const rowH = Math.max(6, lines.length * 4);
    if (y + rowH > 270) { doc.addPage(); y = 20; }
    xPos = 15;
    doc.text(lines, xPos + 1, y + 4); xPos += colWidths[0];
    doc.text(item.hsn_code || "", xPos + 1, y + 4); xPos += colWidths[1];
    doc.text(String(item.quantity || 0), xPos + 1, y + 4); xPos += colWidths[2];
    doc.text(`₹${(item.unit_price || 0).toLocaleString("en-IN")}`, xPos + 1, y + 4); xPos += colWidths[3];
    doc.text(`₹${lineTotal.toLocaleString("en-IN")}`, xPos + 1, y + 4);
    y += rowH;
    doc.setDrawColor(220);
    doc.line(15, y, 195, y);
  });

  y += 5;

  // Totals
  const rightX = 195;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal`, 140, y);
  doc.text(`₹${(invoice.subtotal || 0).toLocaleString("en-IN")}`, rightX, y, { align: "right" });
  y += 7;
  doc.text(`Total Tax`, 140, y);
  doc.text(`₹${(invoice.total_tax || 0).toLocaleString("en-IN")}`, rightX, y, { align: "right" });
  y += 7;
  doc.setFontSize(12);
  doc.text(`Total`, 140, y);
  doc.text(`₹${(invoice.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, rightX, y, { align: "right" });
  y += 7;

  if (invoice.amount_paid) {
    doc.setFontSize(10);
    doc.text(`Amount Paid`, 140, y);
    doc.text(`₹${invoice.amount_paid.toLocaleString("en-IN")}`, rightX, y, { align: "right" });
    y += 7;
    doc.text(`Balance Due`, 140, y);
    doc.text(`₹${(invoice.balance_due || 0).toLocaleString("en-IN")}`, rightX, y, { align: "right" });
    y += 7;
  }

  y += 5;

  // Tax breakup
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Tax Breakup", 15, y); y += 5;
  doc.setFont("helvetica", "normal");
  const totalCGST = (invoice.items || []).reduce((s: number, i: any) => s + (i.cgst || 0), 0);
  const totalSGST = (invoice.items || []).reduce((s: number, i: any) => s + (i.sgst || 0), 0);
  doc.text(`CGST: ₹${totalCGST.toFixed(2)}  |  SGST: ₹${totalSGST.toFixed(2)}`, 15, y); y += 6;

  // Bank details
  if (bp.bank_name || bp.bank_account_no) {
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details", 15, y); y += 5;
    doc.setFont("helvetica", "normal");
    if (bp.bank_name) { doc.text(`Bank: ${bp.bank_name}`, 15, y); y += 4; }
    if (bp.bank_account_no) { doc.text(`A/c No: ${bp.bank_account_no}`, 15, y); y += 4; }
    if (bp.bank_ifsc) { doc.text(`IFSC: ${bp.bank_ifsc}`, 15, y); y += 4; }
    if (bp.upi_id) { doc.text(`UPI: ${bp.upi_id}`, 15, y); y += 4; }
  }

  // Footer
  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(bp.invoice_footer || invoice.notes || "Thank you for your business!", 105, y, { align: "center" });

  if (invoice.terms) {
    y += 6;
    doc.text(`Terms: ${invoice.terms}`, 105, y, { align: "center" });
  }

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice & { customer?: any; businessProfile?: any }) {
  const doc = generateInvoicePDF(invoice);
  doc.save(`${invoice.invoice_number}.pdf`);
}
