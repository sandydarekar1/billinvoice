"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, Search, IndianRupee, Package, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Customer, Product, AnomalyResult } from "@/types";

interface LineItem { id: string; description: string; hsn_code: string; quantity: number; unit_price: number; gst_rate: number; cgst: number; sgst: number; igst: number; total: number; }

interface HSNSuggestion { hsnCode: string; description: string; gstRate: number; category: string; }

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [invoiceType, setInvoiceType] = useState("invoice");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  const [items, setItems] = useState<LineItem[]>([{ id: "1", description: "", hsn_code: "", quantity: 1, unit_price: 0, gst_rate: 18, cgst: 0, sgst: 0, igst: 0, total: 0 }]);
  const [error, setError] = useState("");
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [hsnSearch, setHsnSearch] = useState("");
  const [hsnResults, setHsnResults] = useState<HSNSuggestion[]>([]);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || [])).catch(() => {});
    fetch("/api/products").then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {});
  }, []);

  const searchHSN = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setHsnResults([]); return; }
    const res = await fetch(`/api/gst?action=search&q=${encodeURIComponent(q)}`);
    setHsnResults((await res.json()).results || []);
  }, []);

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    const newItems = [...items];
    const item = { ...newItems[idx], [field]: value };
    const qty = item.quantity || 0, price = item.unit_price || 0;
    const lineTotal = +(qty * price).toFixed(2);
    const gstAmt = +(lineTotal * (item.gst_rate / 100)).toFixed(2);
    item.cgst = +(gstAmt / 2).toFixed(2);
    item.sgst = +(gstAmt / 2).toFixed(2);
    item.total = +(lineTotal + gstAmt).toFixed(2);
    newItems[idx] = item;
    setItems(newItems);
  }

  function addProductItem(product: Product) {
    const newItem: LineItem = {
      id: crypto.randomUUID(), description: product.name, hsn_code: product.hsn_code, quantity: 1,
      unit_price: product.unit_price, gst_rate: product.gst_rate, cgst: 0, sgst: 0, igst: 0, total: 0,
    };
    const qty = 1, price = product.unit_price, lineTotal = +(qty * price).toFixed(2);
    const gstAmt = +(lineTotal * (product.gst_rate / 100)).toFixed(2);
    newItem.cgst = +(gstAmt / 2).toFixed(2);
    newItem.sgst = +(gstAmt / 2).toFixed(2);
    newItem.total = +(lineTotal + gstAmt).toFixed(2);
    setItems([...items, newItem]);
  }

  function addItem() {
    setItems([...items, { id: crypto.randomUUID(), description: "", hsn_code: "", quantity: 1, unit_price: 0, gst_rate: 18, cgst: 0, sgst: 0, igst: 0, total: 0 }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  function selectHSN(idx: number, hsn: HSNSuggestion) {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], hsn_code: hsn.hsnCode, gst_rate: hsn.gstRate, description: newItems[idx].description || hsn.description };
    setItems(newItems);
    setActiveItemIdx(null); setHsnResults([]); setHsnSearch("");
  }

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
  const totalTax = items.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0);
  const totalAmount = subtotal + totalTax;

  async function checkAnomalies() {
    try {
      const res = await fetch("/api/anomaly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoice: { customer_id: customerId, items, total_amount: totalAmount } }) });
      setAnomalies((await res.json()).anomalies || []);
    } catch { /* ignore */ }
  }

  async function handleSubmit(status: "draft" | "sent") {
    setError("");
    if (!customerId) { setError("Please select a customer"); return; }
    if (!items.some(i => i.description)) { setError("Add at least one item with description"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, invoice_date: invoiceDate, due_date: dueDate, status, items, notes, invoice_type: invoiceType, is_recurring: isRecurring, recurring_interval: isRecurring ? recurringInterval : "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.join(", ") || "Failed");
      router.push(`/invoices/${data.invoice.id}`);
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Create a GST-compliant invoice</p>
        </div>
      </div>

      {error && <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive">{error}</div>}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-md text-sm ${a.severity === "high" ? "bg-destructive/10 text-destructive" : a.severity === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><div><strong>{a.field}:</strong> {a.issue}. <em>{a.suggestion}</em></div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Customer</Label><Select value={customerId} onValueChange={setCustomerId}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Invoice Date</Label><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Type</Label><Select value={invoiceType} onValueChange={setInvoiceType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="invoice">Invoice</SelectItem><SelectItem value="quotation">Quotation</SelectItem><SelectItem value="proforma">Proforma</SelectItem><SelectItem value="delivery_challan">Delivery Challan</SelectItem></SelectContent></Select></div>
        </CardContent>
      </Card>

      {/* Recurring toggle */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <Label>Recurring Invoice</Label>
        </div>
        <button onClick={() => setIsRecurring(!isRecurring)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? "bg-primary" : "bg-input"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${isRecurring ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        {isRecurring && (
          <Select value={recurringInterval} onValueChange={setRecurringInterval}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{["weekly", "monthly", "quarterly", "yearly"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {/* Product catalog quick-add */}
      {products.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Quick Add from Products</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {products.slice(0, 12).map((p) => (
                <Button key={p.id} variant="outline" size="sm" onClick={() => addProductItem(p)} className="text-xs">
                  <Plus className="h-3 w-3 mr-1" />{p.name} <Badge variant="secondary" className="ml-1 text-[10px]">{p.gst_rate}%</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead className="w-[250px]">Description</TableHead><TableHead className="w-[120px]">HSN</TableHead><TableHead className="w-[80px] text-right">Qty</TableHead><TableHead className="w-[100px] text-right">Price</TableHead><TableHead className="w-[80px] text-right">GST%</TableHead><TableHead className="w-[100px] text-right">Total</TableHead><TableHead className="w-[40px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell><Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Item description" className="border-0 px-0" /></TableCell>
                  <TableCell className="relative">
                    <Input value={item.hsn_code} onChange={(e) => { updateItem(idx, "hsn_code", e.target.value); setActiveItemIdx(idx); setHsnSearch(e.target.value); searchHSN(e.target.value); }} onFocus={() => { setActiveItemIdx(idx); setHsnSearch(item.hsn_code); searchHSN(item.hsn_code); }} placeholder="HSN" className="border-0 px-0" />
                    {activeItemIdx === idx && hsnResults.length > 0 && (
                      <div className="absolute top-full left-0 z-20 w-80 bg-popover border rounded-md shadow-lg p-1 mt-1 max-h-40 overflow-y-auto">
                        {hsnResults.map((h) => (
                          <button key={h.hsnCode} className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm flex items-center justify-between" onClick={() => selectHSN(idx, h)}>
                            <span>{h.description}</span><Badge variant="secondary" className="text-xs">{h.hsnCode} | {h.gstRate}%</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", +e.target.value)} className="border-0 px-0 text-right" /></TableCell>
                  <TableCell><Input type="number" min={0} step="0.01" value={item.unit_price || ""} onChange={(e) => updateItem(idx, "unit_price", +e.target.value)} className="border-0 px-0 text-right" /></TableCell>
                  <TableCell><Select value={String(item.gst_rate)} onValueChange={(v) => updateItem(idx, "gst_rate", +v)}><SelectTrigger className="border-0 h-8 text-right"><SelectValue /></SelectTrigger><SelectContent>{[0, 3, 5, 12, 18, 28].map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length <= 1}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-6">
        <div className="space-y-2 text-right">
          <div className="flex justify-between gap-8 text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between gap-8 text-sm"><span className="text-muted-foreground">Total Tax</span><span>{formatCurrency(totalTax)}</span></div>
          <div className="flex justify-between gap-8 text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={checkAnomalies} variant="outline" size="sm"><AlertTriangle className="h-4 w-4 mr-1" />Check</Button>
          <Button onClick={() => handleSubmit("sent")} disabled={creating}><IndianRupee className="h-4 w-4 mr-1" />{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Send"}</Button>
          <Button onClick={() => handleSubmit("draft")} variant="outline" disabled={creating}>Save as Draft</Button>
        </div>
      </div>
    </div>
  );
}
