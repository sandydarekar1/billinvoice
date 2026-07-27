import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";
import type { Product } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = getServiceClient();
    const { data } = await (db.from("products") as any).select("*").eq("user_id", session.sub).order("name");
    return NextResponse.json({ products: data || [] });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    const db = getServiceClient();
    const { data, error } = await (db.from("products") as any).insert({
      user_id: session.sub, name: body.name, hsn_code: body.hsn_code || "",
      gst_rate: body.gst_rate ?? 18, unit_price: body.unit_price ?? 0,
      unit: body.unit || "pcs", category: body.category || "",
      description: body.description || "", sku: body.sku || "",
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
