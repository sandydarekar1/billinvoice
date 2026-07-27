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
    const { data } = await (db.from("business_profiles") as any).select("*").eq("user_id", session.sub).single();
    return NextResponse.json({ profile: data || null });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const db = getServiceClient();
    const { data: existing } = await (db.from("business_profiles") as any).select("id").eq("user_id", session.sub).single();
    if (existing) {
      const { data, error } = await (db.from("business_profiles") as any).update({ ...body, updated_at: new Date().toISOString() }).eq("user_id", session.sub).select().single();
      if (error) throw error;
      return NextResponse.json({ profile: data });
    } else {
      const { data, error } = await (db.from("business_profiles") as any).insert({ user_id: session.sub, ...body }).select().single();
      if (error) throw error;
      return NextResponse.json({ profile: data }, { status: 201 });
    }
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
