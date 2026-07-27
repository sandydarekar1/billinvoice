import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";
import { generateInvoiceNumber, validateInvoice, calculateInvoice, calculateItemTotal } from "@/lib/engine/invoice-engine";
import { detectAnomalies } from "@/lib/engine/invoice-engine";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = getServiceClient();
    let query = (db.from("invoices") as any).select("*, customer:customers(name, gstin)").eq("user_id", session.sub).order("created_at", { ascending: false }).limit(limit);

    if (status) query = query.eq("status", status);
    if (customerId) query = query.eq("customer_id", customerId);
    if (search) query = query.or(`invoice_number.ilike.%${search}%,notes.ilike.%${search}%`);

    const { data: invoices } = await query;

    return NextResponse.json({ invoices: invoices || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const errors = validateInvoice(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const db = getServiceClient();

    const { data: lastInvoice } = await (db.from("invoices") as any)
      .select("invoice_number")
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const invoiceNumber = generateInvoiceNumber(lastInvoice?.invoice_number);

    const processedItems = body.items.map((item: any) => calculateItemTotal(item));
    const { subtotal, totalTax, totalAmount } = calculateInvoice(processedItems);

    const { data: existing } = await (db.from("invoices") as any)
      .select("id")
      .eq("user_id", session.sub)
      .limit(100);

    const anomalies = detectAnomalies({ ...body, total_amount: totalAmount }, (existing as any) || []);

    const invoice = {
      user_id: session.sub,
      customer_id: body.customer_id,
      invoice_number: invoiceNumber,
      invoice_date: body.invoice_date || new Date().toISOString().split("T")[0],
      due_date: body.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: body.status || "draft",
      items: processedItems,
      subtotal,
      total_tax: totalTax,
      total_amount: totalAmount,
      notes: body.notes || "",
      terms: body.terms || "",
      place_of_supply: body.place_of_supply || "",
      reverse_charge: body.reverse_charge || false,
      version: 1,
    };

    const { data: created, error } = await (db.from("invoices") as any).insert(invoice).select().single();
    if (error) throw error;

    await (db.from("invoice_versions") as any).insert({
      invoice_id: created.id,
      version: 1,
      snapshot: invoice,
      diff: "Initial version",
    });

    return NextResponse.json({ invoice: created, anomalies }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
