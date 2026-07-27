"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Loader2, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceVersion } from "@/types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & { customer?: any }) | null>(null);
  const [versions, setVersions] = useState<InvoiceVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setInvoice(data.invoice);
        setVersions(data.versions || []);
      } catch (e: any) {
        setError(e.message);
      }
      finally { setLoading(false); }
    }
    fetchInvoice();
  }, [params.id]);

  async function handleExport(format: "json" | "csv" | "markdown") {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, invoiceIds: [params.id] }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoice?.invoice_number}.${format === "markdown" ? "md" : format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error || !invoice) return <div className="text-center py-8 text-muted-foreground">{error || "Invoice not found"}</div>;

  const statusVariant = (s: string) => {
    switch (s) { case "paid": return "success"; case "sent": return "warning"; case "overdue": return "destructive"; case "draft": return "secondary"; default: return "outline"; }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">Created {formatDate(invoice.created_at)} </p>
          </div>
          <Badge variant={statusVariant(invoice.status) as any}>{invoice.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Invoice Details</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1" />Version History ({versions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Customer + Date info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Customer</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><p className="font-medium">{invoice.customer?.name || invoice.customer_id}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Invoice Date</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><p className="font-medium">{formatDate(invoice.invoice_date)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Due Date</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><p className="font-medium">{formatDate(invoice.due_date)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Version</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><p className="font-medium">v{invoice.version}</p></CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>HSN</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">GST</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoice.items || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.hsn_code}</TableCell>
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

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tax</span><span>{formatCurrency(invoice.total_tax)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(invoice.total_amount)}</span></div>
            </div>
          </div>

          {invoice.notes && <Card><CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{invoice.notes}</p></CardContent></Card>}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No version history</TableCell></TableRow>
                  ) : (
                    versions.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">v{v.version}</TableCell>
                        <TableCell>{formatDate(v.created_at)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.diff || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
