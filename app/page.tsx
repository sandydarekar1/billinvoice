"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Menu, X, ArrowRight, Check, FileText, Shield, Zap, BarChart3, Smartphone, IndianRupee, ScanLine } from "lucide-react";

const features = [
  { icon: FileText, title: "Smart Invoicing", desc: "Create professional GST-compliant invoices in seconds with auto-calculation." },
  { icon: IndianRupee, title: "GST/HSN Engine", desc: "Built-in 20+ HSN categories with automatic GST rate suggestions." },
  { icon: BarChart3, title: "Executive Dashboard", desc: "Real-time revenue analytics, status breakdowns, and customer insights." },
  { icon: ScanLine, title: "AI OCR Analysis", desc: "Scan paper invoices with AI — extract data automatically via OpenAI, Claude, or Gemini." },
  { icon: Shield, title: "Anomaly Detection", desc: "Automatic fraud detection for duplicate invoices, wrong GST rates, and GSTIN validation." },
  { icon: Zap, title: "Export Anywhere", desc: "Export invoices as JSON, CSV, or Markdown. Self-host with Docker." },
];

const pricingPlans = [
  { name: "Starter", price: "Free", features: ["Up to 50 invoices/mo", "GST/HSN suggestions", "Basic dashboard", "CSV export"], cta: "Get Started", popular: false },
  { name: "Pro", price: "₹999/mo", features: ["Unlimited invoices", "AI OCR scanning", "Anomaly detection", "All export formats", "Priority support"], cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "Custom", features: ["Everything in Pro", "Custom integrations", "Dedicated support", "SLA guarantee", "SSO + RBAC"], cta: "Contact Sales", popular: false },
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold tracking-tight">InvoicePro</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link href="/register"><Button size="sm">Start Free</Button></Link>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {mobileMenu && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#features" className="block px-3 py-2 text-sm rounded-md hover:bg-muted" onClick={() => setMobileMenu(false)}>Features</a>
              <a href="#pricing" className="block px-3 py-2 text-sm rounded-md hover:bg-muted" onClick={() => setMobileMenu(false)}>Pricing</a>
              <Link href="/login" className="block px-3 py-2 text-sm rounded-md hover:bg-muted" onClick={() => setMobileMenu(false)}>Sign In</Link>
              <Link href="/register" className="block" onClick={() => setMobileMenu(false)}><Button size="sm" className="w-full">Start Free</Button></Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">Trusted by 10,000+ Indian Businesses</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Smart Invoicing for<br />
            <span className="text-primary">Indian Businesses</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Create GST-compliant invoices, track payments, scan bills with AI, and export anywhere. The complete invoicing platform like MyBillBook & Vyapar — self-hosted and open source.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"><Button size="lg" className="text-base">Start Free →</Button></Link>
            <Link href="/login"><Button variant="outline" size="lg" className="text-base">View Demo</Button></Link>
          </div>
          <div className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Invoices Created", value: "2.5M+" },
                { label: "GST Compliant", value: "100%" },
                { label: "Avg Time Saved", value: "85%" },
                { label: "Uptime", value: "99.9%" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="mt-2 text-muted-foreground">Comprehensive invoicing toolkit for modern Indian businesses</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <f.icon className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
            <p className="mt-2 text-muted-foreground">Start free, upgrade as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>}
                <CardContent className="pt-6 text-center">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-3 text-3xl font-bold">{plan.price}</div>
                  <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center justify-center gap-2"><Check className="h-4 w-4 text-emerald-500" />{f}</li>
                    ))}
                  </ul>
                  <Link href="/register"><Button className="mt-6 w-full" variant={plan.popular ? "default" : "outline"}>{plan.cta}</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Simplify Your Invoicing?</h2>
          <p className="mt-3 text-primary-foreground/80">Join thousands of Indian businesses already using InvoicePro.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"><Button size="lg" variant="secondary" className="text-base">Create Free Account</Button></Link>
            <Button size="lg" variant="outline" className="text-base bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">Schedule Demo</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <IndianRupee className="h-5 w-5" />
            <span className="font-semibold text-foreground">InvoicePro</span>
          </div>
          <p>Built for Indian businesses. Self-hostable via Docker. Open source.</p>
        </div>
      </footer>
    </div>
  );
}
