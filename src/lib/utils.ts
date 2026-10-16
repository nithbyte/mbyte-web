import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return "--:--";
  return timeString;
}

export function isOrgMatch(recordOrgId?: string | null, targetOrgId?: string | null): boolean {
  if (!recordOrgId || !targetOrgId) return false;
  if (recordOrgId === targetOrgId) return true;

  // Normalize Novis variants (DB UUID and tenant slug)
  const isNovisA = recordOrgId === "org_novis_001" || recordOrgId === "28101346-8d53-4e0e-9433-feec8dbfeb28";
  const isNovisB = targetOrgId === "org_novis_001" || targetOrgId === "28101346-8d53-4e0e-9433-feec8dbfeb28";
  if (isNovisA && isNovisB) return true;

  // Normalize Apex / Zenith variants
  const isApexA = recordOrgId === "org_apex_002" || recordOrgId === "31524081-7b14-4925-a331-e4cd05a62e04";
  const isApexB = targetOrgId === "org_apex_002" || targetOrgId === "31524081-7b14-4925-a331-e4cd05a62e04";
  if (isApexA && isApexB) return true;

  return false;
}

