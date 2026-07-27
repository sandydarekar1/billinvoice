import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";
import { validateInvoice, calculateInvoice, calculateItemTotal } from "@/lib/engine/invoice-engine";
import { generateDiff } from "@/lib/engine/export";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();
    const { data: invoice } = await (db.from("invoices") as any)
      .select("*, customer:customers(name, gstin, email, phone, billing_address)")
      .eq("id", params.id)
      .eq("user_id", session.sub)
      .single();

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const { data: versions } = await (db.from("invoice_versions") as any)
      .select("*")
      .eq("invoice_id", params.id)
      .order("version", { ascending: false });

    return NextResponse.json({ invoice, versions: versions || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();
    const { data: existing } = await (db.from("invoices") as any)
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.sub)
      .single();

    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const existingData = existing as Record<string, any>;

    const body = await request.json();
    const errors = validateInvoice(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const processedItems = body.items.map((item: any) => calculateItemTotal(item));
    const { subtotal, totalTax, totalAmount } = calculateInvoice(processedItems);

    const updated = {
      customer_id: body.customer_id || existingData.customer_id,
      invoice_date: body.invoice_date || existingData.invoice_date,
      due_date: body.due_date || existingData.due_date,
      status: body.status || existingData.status,
      items: processedItems,
      subtotal,
      total_tax: totalTax,
      total_amount: totalAmount,
      notes: body.notes ?? existingData.notes,
      terms: body.terms ?? existingData.terms,
      place_of_supply: body.place_of_supply ?? existingData.place_of_supply,
      reverse_charge: body.reverse_charge ?? existingData.reverse_charge,
      version: existingData.version + 1,
    };

    const { data: result, error } = await (db.from("invoices") as any)
      .update(updated)
      .eq("id", params.id)
      .eq("user_id", session.sub)
      .select()
      .single();

    if (error) throw error;

    const diff = generateDiff(existingData as any, { ...existingData, ...updated } as any);

    await (db.from("invoice_versions") as any).insert({
      invoice_id: params.id,
      version: updated.version,
      snapshot: { ...existingData, ...updated },
      diff,
    });

    return NextResponse.json({ invoice: result, diff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();
    const { error } = await db.from("invoices")
      .delete()
      .eq("id", params.id)
      .eq("user_id", session.sub);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
