"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, CalendarCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebarStore } from "@/store";
import { useCurrentUser } from "@/hooks";
import { tokenStorage } from "@/lib/api-client";
import { normalizeRole } from "@/types";
import { cn } from "@/lib/utils";

const MR_RESTRICTED_PREFIXES = [
  "/orders",
  "/collections",
  "/receivables",
  "/distributors",
  "/pharmacies",
  "/doctors",
  "/commercial",
  "/reports",
  "/companies",
];

const SUPER_ADMIN_RESTRICTED_PREFIXES = [
  "/visits",
  "/orders",
  "/collections",
  "/receivables",
  "/distributors",
  "/pharmacies",
  "/doctors",
  "/products",
  "/product-presence",
  "/commercial",
  "/reports",
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const { data: currentUser, isLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);

  const canonicalRole = normalizeRole(currentUser?.role);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    // If no token exists, redirect to login
    if (!token && !isLoading) {
      router.push("/login");
    } else {
      setAuthChecked(true);
    }
  }, [isLoading, router]);

  useEffect(() => {
    if (canonicalRole === "SUPER_ADMIN" && pathname === "/") {
      router.replace("/companies");
    }
  }, [canonicalRole, pathname, router]);

  // Check Role Route Authorization
  const isSuperAdminRoute = pathname.startsWith("/companies");
  const isBlockedSuperAdmin = isSuperAdminRoute && canonicalRole !== "SUPER_ADMIN";

  const isBlockedOperationalForSuperAdmin =
    canonicalRole === "SUPER_ADMIN" &&
    SUPER_ADMIN_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const isBlockedMR =
    canonicalRole === "MR" &&
    MR_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#171717]">
      <Suspense fallback={<div className="w-16 lg:w-64" />}>
        <Sidebar />
      </Suspense>
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <Suspense fallback={<div className="h-16" />}>
          <Header />
        </Suspense>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {isBlockedSuperAdmin ? (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-8 text-center dark:border-purple-900/50 dark:bg-purple-950/20 shadow-xs">
                <ShieldAlert className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400 mb-3" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Access Restricted to Super Administrators
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Company management and platform-level tenant governance require Super Admin permissions.
                </p>
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to Company Dashboard</span>
                  </Link>
                </div>
              </div>
            ) : isBlockedOperationalForSuperAdmin ? (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-8 text-center dark:border-purple-900/50 dark:bg-purple-950/20 shadow-xs">
                <ShieldAlert className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400 mb-3" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Company Operational Details are Isolated
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Super Admin permissions are limited to platform company creation and Company Administrator provisioning. Operational field visits, customer relations, products, and inventory are strictly isolated to each respective Company Administrator.
                </p>
                <div className="mt-4">
                  <Link
                    href="/companies"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to Companies Portal</span>
                  </Link>
                </div>
              </div>
            ) : isBlockedMR ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-950/20 shadow-xs">
                <ShieldAlert className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400 mb-3" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Administrative Area Restricted
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Medical Representatives are authorized for personal call schedules, visual aids, and visit reporting. Master customer and commercial management is reserved for Territory Managers and Admins.
                </p>
                <div className="mt-4">
                  <Link
                    href="/visits"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    <span>Go to My Field Visits</span>
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
