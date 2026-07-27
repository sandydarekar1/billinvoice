import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { searchHSN, getHSNByCode, getHSNSuggestions, getCategories, validateGSTIN, getPlaceOfSupplyFromGSTIN } from "@/lib/engine/gst-engine";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "search";
    const query = searchParams.get("q") || "";

    switch (action) {
      case "search":
        return NextResponse.json({ results: searchHSN(query) });
      case "lookup": {
        const hsn = searchParams.get("hsn") || "";
        const result = getHSNByCode(hsn);
        return NextResponse.json({ result: result || null });
      }
      case "suggest": {
        const keywords = query.split(",").map((k) => k.trim()).filter(Boolean);
        return NextResponse.json({ results: getHSNSuggestions(keywords) });
      }
      case "categories":
        return NextResponse.json({ categories: getCategories() });
      case "validate-gstin": {
        const gstin = query;
        const valid = validateGSTIN(gstin);
        const placeOfSupply = valid ? getPlaceOfSupplyFromGSTIN(gstin) : null;
        return NextResponse.json({ valid, placeOfSupply });
      }
      default:
        return NextResponse.json({ results: searchHSN(query) });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
