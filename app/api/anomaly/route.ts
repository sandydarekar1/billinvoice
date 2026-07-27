import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";
import { detectAnomalies } from "@/lib/engine/invoice-engine";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const invoice = body.invoice;

    if (!invoice) {
      return NextResponse.json({ error: "Invoice data required" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: allInvoices } = await (db.from("invoices") as any)
      .select("id, customer_id, total_amount, items, created_at, status")
      .eq("user_id", session.sub);

    const anomalies = detectAnomalies(invoice, (allInvoices as any) || []);

    return NextResponse.json({ anomalies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
