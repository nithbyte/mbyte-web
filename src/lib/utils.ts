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

/**
 * Returns today's calendar date in local timezone as YYYY-MM-DD.
 * Prevents UTC timezone shift bug (e.g. in India IST or US EDT).
 */
export function getLocalTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's calendar date in local timezone as YYYY-MM-DD.
 */
export function getLocalYesterdayDate(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Strictly validates an ISO calendar date string (YYYY-MM-DD).
 * Validates format, calendar months (01-12), and valid days per month
 * including leap years (e.g., rejects 2026-02-31, 2026-04-31, 2025-02-29).
 */
export function isValidIsoDate(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maxDay = daysInMonth[month - 1];
  return day >= 1 && day <= maxDay;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Formats YYYY-MM-DD date for UI display without UTC timezone shift.
 * Statically safe for Next.js SSR / partial prerendering.
 */
export function formatOperatingDateDisplay(
  dateStr: string,
  options?: { todayStr?: string; yesterdayStr?: string }
): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) {
    return dateStr;
  }

  const formatted = `${MONTH_NAMES[monthIdx]} ${day}, ${year}`;

  if (options?.todayStr && dateStr === options.todayStr) {
    return `Today (${formatted})`;
  }
  if (options?.yesterdayStr && dateStr === options.yesterdayStr) {
    return `Yesterday (${formatted})`;
  }

  return formatted;
}

