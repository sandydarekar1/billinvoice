import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient } from "@/lib/supabase/client";
import { createToken, setSession, clearSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: user } = await (db.from("users") as any).select("id, email, name, password_hash, company_name, created_at").eq("email", email.toLowerCase()).single();
    const userData = user as any;

    if (!userData) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, userData.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createToken({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      company_name: userData.company_name,
      created_at: userData.created_at,
      updated_at: userData.created_at,
    });

    await setSession(token);

    return NextResponse.json({
      user: { id: userData.id, email: userData.email, name: userData.name, company_name: userData.company_name },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
