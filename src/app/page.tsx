import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Mediqbyte FieldOps 2.0 | Next-Gen Enterprise Pharma Execution",
  description:
    "Enterprise Pharmaceutical Field Intelligence & Multi-Tenant Platform. Precision GPS telemetry, offline-first SQLite detailing, in-app WebRTC calls, and strict tenant data isolation.",
};

export default function HomePage() {
  return (
    <div className="bg-[#05070B] min-h-screen w-full max-w-full overflow-x-hidden">
      <LandingPage />
    </div>
  );
}
