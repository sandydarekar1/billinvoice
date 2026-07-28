import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

let JWT_SECRET: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (!JWT_SECRET) {
    if (!process.env.JWT_SECRET) {
      throw new Error("Missing JWT_SECRET environment variable");
    }
    JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return JWT_SECRET;
}

const PROTECTED_ROUTES = ["/dashboard", "/invoices", "/customers", "/products", "/settings", "/ocr"];
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("invoicepro-token")?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, getJwtSecret());
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/customers/:path*",
    "/products/:path*",
    "/settings/:path*",
    "/ocr/:path*",
    "/login",
    "/register",
  ],
};
