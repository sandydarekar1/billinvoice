import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = getServiceClient();
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");
    let query = (db.from("payments") as any).select("*, invoice:invoices(invoice_number)").eq("user_id", session.sub).order("payment_date", { ascending: false });
    if (invoiceId) query = query.eq("invoice_id", invoiceId);
    const { data } = await query;
    return NextResponse.json({ payments: data || [] });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { invoice_id, amount, payment_date, payment_mode, reference_no, notes } = await request.json();
    if (!invoice_id || !amount) return NextResponse.json({ error: "Invoice ID and amount required" }, { status: 400 });
    const db = getServiceClient();
    const { data: inv } = await (db.from("invoices") as any).select("total_amount, amount_paid, status").eq("id", invoice_id).eq("user_id", session.sub).single();
    if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const newPaid = (+inv.amount_paid || 0) + amount;
    const balance = (+inv.total_amount || 0) - newPaid;
    const newStatus = balance <= 0 ? "paid" : inv.status === "overdue" ? "overdue" : "sent";
    await (db.from("payments") as any).insert({
      user_id: session.sub, invoice_id, amount, payment_date: payment_date || new Date().toISOString().split("T")[0],
      payment_mode: payment_mode || "bank_transfer", reference_no: reference_no || "", notes: notes || "",
    });
    await (db.from("invoices") as any).update({ amount_paid: newPaid, balance_due: balance, status: newStatus }).eq("id", invoice_id);
    return NextResponse.json({ success: true, amount_paid: newPaid, balance_due: balance, status: newStatus }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
