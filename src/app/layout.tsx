import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MByte FieldOps | Pharma Field-Force Admin Portal",
  description:
    "Enterprise Field-Force Operations & Territory Management System for Novis Pharma. Real-time visit telemetry, GPS compliance, order booking, and stock analytics.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white dark:bg-slate-950 dark:text-slate-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
