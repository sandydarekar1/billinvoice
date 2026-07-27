import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "InvoicePro — Smart Invoicing for Indian Businesses",
  description: "Professional invoicing software with GST compliance, invoice management, AI-powered OCR, and real-time analytics. Built for Indian businesses.",
  keywords: "invoicing, GST, billing, invoice software, Indian business, tax compliance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        {children}
      </body>
    </html>
  );
}
