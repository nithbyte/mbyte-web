import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MByte FieldOps | Pharma Field-Force Admin Portal",
  description:
    "Enterprise Multi-Tenant Field-Force Operations & Territory Management System. Real-time visit telemetry, GPS compliance, order booking, and stock analytics.",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.png",
    apple: "/icon.png",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50/50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white dark:bg-[#011126] dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
