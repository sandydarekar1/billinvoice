import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { analyzeInvoiceImage, isImageType, getMaxFileSize } from "@/lib/engine/ocr";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("invoicepro-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!isImageType(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WEBP, GIF, or PDF" }, { status: 400 });
    }

    if (file.size > getMaxFileSize()) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const provider = (formData.get("provider") as string) || "openai";
    const apiKey = (formData.get("api_key") as string) || "";

    const result = await analyzeInvoiceImage(base64, provider, apiKey);

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "OCR analysis failed" }, { status: 500 });
  }
}
