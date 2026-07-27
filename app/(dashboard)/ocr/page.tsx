"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ScanLine, Loader2, FileText, IndianRupee, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { OCRResult } from "@/types";

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("invoicepro-ai-settings");
    if (stored) {
      const s = JSON.parse(stored);
      setProvider(s.provider || "openai");
      setApiKey(s.api_key || "");
    }
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("File too large (max 10MB)"); return; }
    setFile(f);
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleAnalyze() {
    if (!file) { setError("Please select a file"); return; }
    setAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", provider);
      formData.append("api_key", apiKey);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e: any) {
      setError(e.message);
    }
    finally { setAnalyzing(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">OCR Scanner</h1>
        <p className="text-sm text-muted-foreground">Scan and extract data from invoice images using AI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Invoice</CardTitle>
            <CardDescription>Upload an invoice image or PDF for AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-md" />
              ) : (
                <div className="space-y-2">
                  <ScanLine className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF (max 10MB)</p>
                </div>
              )}
            </div>

            {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Provider</label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <Button onClick={handleAnalyze} disabled={!file || analyzing} className="w-full">
              {analyzing ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Analyzing...</> : <><ScanLine className="h-4 w-4 mr-1" />Analyze Invoice</>}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Extracted Data</CardTitle>
          </CardHeader>
          <CardContent>
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p>Analyzing invoice...</p>
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <Badge variant={result.confidence > 0.7 ? "success" : "warning"}>
                    {(result.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>

                <ResultRow label="Invoice Number" value={result.invoice_number} />
                <ResultRow label="Date" value={result.date} />
                <ResultRow label="Vendor" value={result.vendor_name} />
                <ResultRow label="GSTIN" value={result.vendor_gstin} />
                <ResultRow label="Total Amount" value={result.total_amount ? formatCurrency(result.total_amount) : null} />
                <ResultRow label="Tax Amount" value={result.tax_amount ? formatCurrency(result.tax_amount) : null} />

                {result.items && result.items.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Line Items</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.items.map((item: any, i: number) => (
                        <div key={i} className="text-xs p-2 rounded bg-muted flex justify-between">
                          <span>{item.description}</span>
                          <span>{item.quantity} x {item.unit_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ScanLine className="h-8 w-8 mb-3 opacity-30" />
                <p>Upload an invoice to see extracted data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-1 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
