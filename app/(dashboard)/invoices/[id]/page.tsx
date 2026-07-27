"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, History, IndianRupee, Loader2, Share2, Send, MessageCircle, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { downloadInvoicePDF } from "@/lib/engine/pdf-generator";
import type { Invoice, InvoiceVersion, Payment, BusinessProfile } from "@/types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & { customer?: any }) | null>(null);
  const [versions, setVersions] = useState<InvoiceVersion[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_mode: "bank_transfer", reference_no: "", notes: "" });
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    try {
      const [invRes, payRes, profRes] = await Promise.all([
        fetch(`/api/invoices/${params.id}`),
        fetch(`/api/payments?invoice_id=${params.id}`),
        fetch("/api/business-profile"),
      ]);
      const invData = await invRes.json();
      if (!invRes.ok) throw new Error(invData.error);
      setInvoice(invData.invoice);
      setVersions(invData.versions || []);
      if (payRes.ok) setPayments((await payRes.json()).payments || []);
      if (profRes.ok) setBusinessProfile((await profRes.json()).profile);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  async function handlePayment() {
    if (!payForm.amount) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: params.id, ...payForm, amount: +payForm.amount }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPayOpen(false);
      setPayForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_mode: "bank_transfer", reference_no: "", notes: "" });
      fetchData();
    } catch { /* ignore */ }
    finally { setPaying(false); }
  }

  function handleShareWhatsApp() {
    if (!invoice) return;
    const msg = encodeURIComponent(`*${invoice.invoice_number}*\nAmount: ₹${invoice.total_amount.toLocaleString("en-IN")}\nDate: ${invoice.invoice_date}\nStatus: ${invoice.status}\n\n— Sent via InvoicePro`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function handleShareEmail() {
    if (!invoice) return;
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
    const body = encodeURIComponent(`Dear ${invoice.customer?.name || "Customer"},\n\nPlease find attached invoice ${invoice.invoice_number} for ₹${invoice.total_amount.toLocaleString("en-IN")}.\n\nRegards`);
    window.open(`mailto:${invoice.customer?.email || ""}?subject=${subject}&body=${body}`, "_blank");
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error || !invoice) return <div className="text-center py-8 text-muted-foreground">{error || "Invoice not found"}</div>;

  const statusVariant = (s: string) => {
    switch (s) { case "paid": return "success"; case "sent": return "warning"; case "overdue": return "destructive"; case "draft": return "secondary"; default: return "outline"; }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
          </div>
          <Badge variant={statusVariant(invoice.status) as any}>{invoice.status}</Badge>
          {invoice.invoice_type !== "invoice" && <Badge variant="outline">{invoice.invoice_type}</Badge>}
          {invoice.is_recurring && <Badge variant="secondary">Recurring ({invoice.recurring_interval})</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadInvoicePDF({ ...invoice, businessProfile })}><Download className="h-4 w-4 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
          <Button variant="outline" size="sm" onClick={handleShareEmail}><Send className="h-4 w-4 mr-1" /> Email</Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments"><IndianRupee className="h-4 w-4 mr-1" />Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1" />Versions ({versions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Customer</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="font-medium">{invoice.customer?.name || "—"}</p></CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Date</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="font-medium">{formatDate(invoice.invoice_date)}</p></CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Due</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="font-medium">{formatDate(invoice.due_date)}</p></CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Amount</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="font-medium text-lg">{formatCurrency(invoice.total_amount)}</p></CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Balance</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className={`font-medium text-lg ${(invoice.balance_due || 0) > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatCurrency(invoice.balance_due || invoice.total_amount - (invoice.amount_paid || 0))}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>HSN</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">GST</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(invoice.items || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell><TableCell>{item.hsn_code}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{item.gst_rate}%</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tax</span><span>{formatCurrency(invoice.total_tax)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(invoice.total_amount)}</span></div>
              {invoice.amount_paid ? <div className="flex justify-between text-sm text-emerald-600"><span>Paid</span><span>{formatCurrency(invoice.amount_paid)}</span></div> : null}
              {(invoice.balance_due || (invoice.total_amount - (invoice.amount_paid || 0))) > 0 ? <div className="flex justify-between text-sm text-destructive"><span>Balance Due</span><span>{formatCurrency(invoice.balance_due || invoice.total_amount - (invoice.amount_paid || 0))}</span></div> : null}
            </div>
          </div>

          {invoice.notes && <Card><CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{invoice.notes}</p></CardContent></Card>}
        </TabsContent>

        <TabsContent value="payments">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Payment history for this invoice</p>
            {invoice.status !== "paid" && <Button size="sm" onClick={() => setPayOpen(true)}><IndianRupee className="h-4 w-4 mr-1" />Record Payment</Button>}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No payments recorded</TableCell></TableRow>
                  ) : payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="font-medium text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                      <TableCell><Badge variant="secondary">{p.payment_mode.replace("_", " ")}</Badge></TableCell>
                      <TableCell>{p.reference_no || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Date</TableHead><TableHead>Changes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {versions.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No version history</TableCell></TableRow> : versions.map((v) => (
                    <TableRow key={v.id}><TableCell className="font-medium">v{v.version}</TableCell><TableCell>{formatDate(v.created_at)}</TableCell><TableCell className="text-sm text-muted-foreground">{v.diff || "—"}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="Enter amount" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Mode</Label><Select value={payForm.payment_mode} onValueChange={(v) => setPayForm({ ...payForm, payment_mode: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["cash", "bank_transfer", "upi", "cheque", "other"].map((m) => <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Reference No</Label><Input value={payForm.reference_no} onChange={(e) => setPayForm({ ...payForm, reference_no: e.target.value })} placeholder="UTR / Cheque no" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={handlePayment} disabled={paying}>{paying && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
