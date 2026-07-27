import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";
import { exportInvoices } from "@/lib/engine/export";
import type { ExportOptions } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { format, invoiceIds, dateRange }: ExportOptions = await request.json();

    if (!format || !["json", "csv", "markdown"].includes(format)) {
      return NextResponse.json({ error: "Invalid format. Use json, csv, or markdown" }, { status: 400 });
    }

    const db = getServiceClient();
    let query = (db.from("invoices") as any).select("*, customer:customers(name)").eq("user_id", session.sub);

    if (invoiceIds?.length) {
      query = query.in("id", invoiceIds);
    }
    if (dateRange?.from) {
      query = query.gte("invoice_date", dateRange.from);
    }
    if (dateRange?.to) {
      query = query.lte("invoice_date", dateRange.to);
    }

    const { data: invoices } = await query.order("invoice_date", { ascending: false });

    if (!invoices?.length) {
      return NextResponse.json({ error: "No invoices found" }, { status: 404 });
    }

    const content = exportInvoices(invoices as any, format as "json" | "csv" | "markdown");

    const contentTypes: Record<string, string> = {
      json: "application/json",
      csv: "text/csv",
      markdown: "text/markdown",
    };

    const extensions: Record<string, string> = {
      json: "json",
      csv: "csv",
      markdown: "md",
    };

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentTypes[format],
        "Content-Disposition": `attachment; filename="invoices-export-${Date.now()}.${extensions[format]}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
