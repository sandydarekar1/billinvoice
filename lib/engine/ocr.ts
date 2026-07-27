import type { OCRResult } from "@/types";

export async function analyzeInvoiceImage(
  base64Image: string,
  provider: string = "openai",
  apiKey: string = ""
): Promise<OCRResult> {
  if (!apiKey) {
    // Fallback to metadata-only analysis when no API key
    return extractFromBase64(base64Image);
  }

  try {
    const response = await fetch(getProviderEndpoint(provider), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(getProviderPayload(provider, base64Image)),
    });
    const data = await response.json();
    return parseOCRResponse(provider, data);
  } catch {
    return extractFromBase64(base64Image);
  }
}

function getProviderEndpoint(provider: string): string {
  switch (provider) {
    case "openai": return "https://api.openai.com/v1/chat/completions";
    case "anthropic": return "https://api.anthropic.com/v1/messages";
    case "google": return "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    default: return "https://api.openai.com/v1/chat/completions";
  }
}

function getProviderPayload(provider: string, image: string): unknown {
  const prompt = `Extract invoice details from this image. Return ONLY valid JSON:
{
  "invoice_number": "string or null",
  "date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "vendor_gstin": "string or null",
  "total_amount": number or null,
  "tax_amount": number or null,
  "items": [{ "description": "string", "quantity": number, "unit_price": number, "total": number }],
  "confidence": 0.0 to 1.0
}`;

  switch (provider) {
    case "openai":
      return {
        model: "gpt-4o",
        messages: [
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ]},
        ],
        max_tokens: 1000,
      };
    case "anthropic":
      return {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          ]},
        ],
      };
    default: return {};
  }
}

function parseOCRResponse(provider: string, data: any): OCRResult {
  try {
    let content = "";
    if (provider === "openai") content = data?.choices?.[0]?.message?.content || "";
    else if (provider === "anthropic") content = data?.content?.[0]?.text || "";
    else if (provider === "google") content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as OCRResult;
  } catch { /* fallback */ }
  return { confidence: 0, total_amount: 0 };
}

function extractFromBase64(_base64: string): OCRResult {
  return {
    confidence: 0,
    total_amount: 0,
  };
}

export function isImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(mimeType);
}

export function getMaxFileSize(): number {
  return 10 * 1024 * 1024; // 10MB
}
