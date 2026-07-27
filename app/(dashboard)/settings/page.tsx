"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import type { AISettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings>({ provider: "openai", api_key: "", model: "gpt-4o", ocr_enabled: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("invoicepro-ai-settings");
    if (stored) setSettings(JSON.parse(stored));
  }, []);

  function handleSave() {
    setSaving(true);
    localStorage.setItem("invoicepro-ai-settings", JSON.stringify(settings));
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 500);
  }

  const models: Record<string, string[]> = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    google: ["gemini-1.5-flash", "gemini-1.5-pro"],
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure AI providers and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>Configure the AI provider for OCR invoice scanning and data extraction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={settings.provider} onValueChange={(v) => setSettings({ ...settings, provider: v as any, model: models[v][0] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="google">Google (Gemini)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={settings.model} onValueChange={(v) => setSettings({ ...settings, model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(models[settings.provider] || []).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={settings.api_key}
              onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
              placeholder={`Enter your ${settings.provider} API key`}
            />
            <p className="text-xs text-muted-foreground">Your API key is stored locally in your browser and never sent to our servers.</p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>OCR Scanning</Label>
              <p className="text-xs text-muted-foreground">Enable AI-powered invoice scanning</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, ocr_enabled: !settings.ocr_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.ocr_enabled ? "bg-primary" : "bg-input"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${settings.ocr_enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About InvoicePro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Tech Stack:</strong> Next.js 14, TypeScript, PostgreSQL (Supabase), Tailwind CSS, shadcn/ui</p>
          <p><strong>Deployment:</strong> Docker & Coolify ready</p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline">GST Compliant</Badge>
            <Badge variant="outline">Made in India 🇮🇳</Badge>
            <Badge variant="outline">Self-Hostable</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
