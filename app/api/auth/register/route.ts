import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient } from "@/lib/supabase/client";
import { createToken, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company_name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: existing } = await (db.from("app_users") as any).select("id").eq("email", email.toLowerCase()).single();

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: user, error } = await (db.from("app_users") as any).insert({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      name,
      company_name: company_name || "",
    }).select("id, email, name, company_name, created_at").single();

    if (error || !user) throw error || new Error("Failed to create user");

    const userData = user as unknown as { id: string; email: string; name: string; company_name: string; created_at: string; };

    const token = await createToken({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      company_name: userData.company_name,
      created_at: userData.created_at,
      updated_at: userData.created_at,
    });

    await setSession(token);

    return NextResponse.json({ user: { id: userData.id, email: userData.email, name: userData.name, company_name: userData.company_name } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
