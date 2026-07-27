import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";
import type { DashboardMetrics } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = getServiceClient();

    const { data: invoices } = await (db.from("invoices") as any)
      .select("*, customer:customers(name)").eq("user_id", session.sub);

    const invs = (invoices || []) as any[];

    const total_revenue = invs.reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
    const total_paid = invs.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
    const total_pending = invs.filter((i: any) => i.status === "sent").reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
    const total_overdue = invs.filter((i: any) => i.status === "overdue").length;

    const monthlyMap: Record<string, number> = {};
    invs.forEach((i: any) => {
      const m = i.invoice_date?.substring(0, 7);
      if (m) monthlyMap[m] = (monthlyMap[m] || 0) + (i.total_amount || 0);
    });
    const monthly_revenue = Object.entries(monthlyMap).sort().slice(-12).map(([month, revenue]) => ({ month, revenue: +revenue.toFixed(2) }));

    const custMap: Record<string, number> = {};
    invs.forEach((i: any) => {
      const name = i.customer?.name || i.customer_id;
      custMap[name] = (custMap[name] || 0) + (i.total_amount || 0);
    });
    const top_customers = Object.entries(custMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({ name, total: +total.toFixed(2) }));

    const statusBreakdown = ["draft", "sent", "paid", "overdue", "cancelled"].map((status) => ({
      status,
      count: invs.filter((i: any) => i.status === status).length,
      amount: +invs.filter((i: any) => i.status === status).reduce((s: number, i: any) => s + (i.total_amount || 0), 0).toFixed(2),
    }));

    const metrics: DashboardMetrics = {
      total_invoices: invs.length,
      total_revenue: +total_revenue.toFixed(2),
      total_paid: +total_paid.toFixed(2),
      total_pending: +total_pending.toFixed(2),
      total_overdue,
      monthly_revenue,
      top_customers,
      status_breakdown: statusBreakdown,
    };

    return NextResponse.json(metrics);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
