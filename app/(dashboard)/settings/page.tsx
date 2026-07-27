"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, CheckCircle2, Building2, Cpu } from "lucide-react";
import type { AISettings, BusinessProfile } from "@/types";

export default function SettingsPage() {
  const [tab, setTab] = useState("business");
  const [aiSettings, setAiSettings] = useState<AISettings>({ provider: "openai", api_key: "", model: "gpt-4o", ocr_enabled: true });
  const [business, setBusiness] = useState<Partial<BusinessProfile>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("invoicepro-ai-settings");
    if (stored) setAiSettings(JSON.parse(stored));
    fetch("/api/business-profile")
      .then(r => r.json())
      .then(d => { if (d.profile) setBusiness(d.profile); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveBusiness() {
    setSaving(true);
    try {
      const res = await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function saveAI() {
    setSaving(true);
    localStorage.setItem("invoicepro-ai-settings", JSON.stringify(aiSettings));
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 300);
  }

  const models: Record<string, string[]> = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    google: ["gemini-1.5-flash", "gemini-1.5-pro"],
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business profile and integrations</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="business"><Building2 className="h-4 w-4 mr-1" />Business Profile</TabsTrigger>
          <TabsTrigger value="ai"><Cpu className="h-4 w-4 mr-1" />AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle><CardDescription>These details appear on your invoices and PDFs</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Company Name</Label><Input value={business.company_name || ""} onChange={(e) => setBusiness({ ...business, company_name: e.target.value })} placeholder="Your Company Pvt Ltd" /></div>
                <div className="space-y-2"><Label>Legal Name</Label><Input value={business.legal_name || ""} onChange={(e) => setBusiness({ ...business, legal_name: e.target.value })} placeholder="Registered legal name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>GSTIN</Label><Input value={business.gstin || ""} onChange={(e) => setBusiness({ ...business, gstin: e.target.value })} placeholder="27AABCU9603R1ZX" /></div>
                <div className="space-y-2"><Label>PAN</Label><Input value={business.pan || ""} onChange={(e) => setBusiness({ ...business, pan: e.target.value })} placeholder="AABCU9603R" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={business.phone || ""} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="+91 9876543210" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={business.email || ""} onChange={(e) => setBusiness({ ...business, email: e.target.value })} placeholder="hello@company.com" /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={business.address || ""} onChange={(e) => setBusiness({ ...business, address: e.target.value })} placeholder="123, Business Street" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>City</Label><Input value={business.city || ""} onChange={(e) => setBusiness({ ...business, city: e.target.value })} placeholder="Mumbai" /></div>
                <div className="space-y-2"><Label>State</Label><Input value={business.state || ""} onChange={(e) => setBusiness({ ...business, state: e.target.value })} placeholder="Maharashtra" /></div>
                <div className="space-y-2"><Label>Pincode</Label><Input value={business.pincode || ""} onChange={(e) => setBusiness({ ...business, pincode: e.target.value })} placeholder="400001" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Bank Details</CardTitle><CardDescription>For payment collection shown on invoices</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bank Name</Label><Input value={business.bank_name || ""} onChange={(e) => setBusiness({ ...business, bank_name: e.target.value })} placeholder="State Bank of India" /></div>
                <div className="space-y-2"><Label>Branch</Label><Input value={business.bank_branch || ""} onChange={(e) => setBusiness({ ...business, bank_branch: e.target.value })} placeholder="Main Branch" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Account Number</Label><Input value={business.bank_account_no || ""} onChange={(e) => setBusiness({ ...business, bank_account_no: e.target.value })} placeholder="12345678901" /></div>
                <div className="space-y-2"><Label>IFSC Code</Label><Input value={business.bank_ifsc || ""} onChange={(e) => setBusiness({ ...business, bank_ifsc: e.target.value })} placeholder="SBIN0001234" /></div>
              </div>
              <div className="space-y-2"><Label>UPI ID</Label><Input value={business.upi_id || ""} onChange={(e) => setBusiness({ ...business, upi_id: e.target.value })} placeholder="company@upi" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoice Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Invoice Prefix</Label><Input value={business.invoice_prefix || "INV"} onChange={(e) => setBusiness({ ...business, invoice_prefix: e.target.value })} placeholder="INV" /></div>
                <div className="space-y-2"><Label>Footer Text</Label><Input value={business.invoice_footer || ""} onChange={(e) => setBusiness({ ...business, invoice_footer: e.target.value })} placeholder="Thank you for your business!" /></div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveBusiness} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saved ? "Saved!" : "Save Business Profile"}
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>AI Provider</CardTitle><CardDescription>Configure AI for OCR invoice scanning</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Provider</Label><Select value={aiSettings.provider} onValueChange={(v) => setAiSettings({ ...aiSettings, provider: v as any, model: models[v][0] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai">OpenAI</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem><SelectItem value="google">Google</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Model</Label><Select value={aiSettings.model} onValueChange={(v) => setAiSettings({ ...aiSettings, model: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(models[aiSettings.provider] || []).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>API Key</Label><Input type="password" value={aiSettings.api_key} onChange={(e) => setAiSettings({ ...aiSettings, api_key: e.target.value })} placeholder="sk-..." /></div>
              <Button onClick={saveAI} disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}{saved ? "Saved!" : "Save AI Settings"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
