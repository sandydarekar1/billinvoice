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
    const { data } = await (db.from("customers") as any).select("*").eq("user_id", session.sub).order("name");
    return NextResponse.json({ customers: data || [] });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    const db = getServiceClient();
    const { data, error } = await (db.from("customers") as any).insert({ user_id: session.sub, ...body }).select().single();
    if (error) throw error;
    return NextResponse.json({ customer: data }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
