"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, CalendarCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebarStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrentUser } from "@/hooks";
import { tokenStorage, refreshAuthSession, isTokenExpired } from "@/lib/api-client";
import { normalizeRole, type AppFeatures } from "@/types";
import { getTenantSubdomain, getRootDomain, buildTenantSubdomainUrl, buildRootLoginUrl } from "@/lib/subdomain";
import { cn } from "@/lib/utils";
import { PageTransition } from "./page-transition";

const MR_RESTRICTED_PREFIXES = [
  "/orders",
  "/collections",
  "/receivables",
  "/distributors",
  "/pharmacies",
  "/doctors",
  "/purchasing-doctors",
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
  "/purchasing-doctors",
  "/products",
  "/product-presence",
  "/commercial",
  "/reports",
];

const FEATURE_ROUTE_MAPPING: Array<{ prefix: string; featureKey: keyof AppFeatures; label: string }> = [
  { prefix: "/doctors", featureKey: "doctorManagement", label: "Doctor Management" },
  { prefix: "/purchasing-doctors", featureKey: "doctorManagement", label: "Doctor Management" },
  { prefix: "/pharmacies", featureKey: "chemistManagement", label: "Chemist & Pharmacy Master" },
  { prefix: "/live-tracking", featureKey: "geomapping", label: "Live MR Tracking & Geomapping" },
  { prefix: "/orders", featureKey: "orderBooking", label: "Commercial Order Taking" },
  { prefix: "/commercial", featureKey: "orderBooking", label: "Commercial Order Taking" },
  { prefix: "/collections", featureKey: "collections", label: "Payment Collections & Credit" },
  { prefix: "/receivables", featureKey: "collections", label: "Payment Collections & Credit" },
  { prefix: "/dcr", featureKey: "dcrFiling", label: "Daily Call Reports (DCR)" },
  { prefix: "/tour-plans", featureKey: "tourPlanning", label: "Monthly Tour Planning (MTP)" },
  { prefix: "/products/presence", featureKey: "productPresence", label: "Retail Shelf & Presence Audits" },
  { prefix: "/samples", featureKey: "sampleTracking", label: "Drug Samples & Promo Tracking" },
  { prefix: "/chat", featureKey: "chatAndCalling", label: "In-App Audio Calling & Team Chat" },
  { prefix: "/expenses", featureKey: "expenseManagement", label: "Field Expense Claims (TA/DA)" },
  { prefix: "/attendance", featureKey: "leaveManagement", label: "Attendance & Leave Requests" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const storeUser = useAuthStore((s) => s.user);
  const { data: fetchedUser, isLoading } = useCurrentUser();
  const currentUser = fetchedUser ?? storeUser;
  const [authChecked, setAuthChecked] = useState(false);

  const canonicalRole = normalizeRole(currentUser?.role);


  // Request browser Notification permission once when logged in so background-tab call alerts work
  useEffect(() => {
    if (currentUser?.id && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [currentUser?.id]);

  const currentSubdomain = typeof window !== "undefined" ? getTenantSubdomain() : null;

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      let token = tokenStorage.getAccessToken();

      // If access token is expired or missing, check if a valid refresh token exists to restore session
      if (!token) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken && !isTokenExpired(refreshToken)) {
          token = await refreshAuthSession();
        }
      }

      if (!token && !isLoading && isMounted) {
        if (pathname.startsWith("/companies") || pathname.startsWith("/admin")) {
          router.replace("/admin/login");
        } else if (currentSubdomain) {
          // When on a tenant subdomain without credentials, redirect to canonical root login with tenant param
          window.location.replace(buildRootLoginUrl(currentSubdomain));
        } else {
          router.replace("/login");
        }
      } else if (isMounted) {
        setAuthChecked(true);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [isLoading, router, pathname, currentSubdomain]);

  // Periodic silent background refresh: keeps active dashboard sessions alive automatically
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken && !isTokenExpired(refreshToken)) {
        await refreshAuthSession();
      }
    }, 10 * 60 * 1000); // Silent refresh check every 10 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (canonicalRole === "SUPER_ADMIN" && (pathname === "/" || pathname === "/dashboard")) {
      router.replace("/companies");
    } else if (canonicalRole && canonicalRole !== "SUPER_ADMIN" && pathname.startsWith("/companies")) {
      router.replace("/");
    }
  }, [canonicalRole, pathname, router]);

  const userOrgSlug =
    currentUser?.organization?.slug ||
    (currentUser?.organizationName
      ? currentUser.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "")
      : null) ||
    (canonicalRole !== "SUPER_ADMIN" && typeof window !== "undefined" ? window.localStorage.getItem("mbyte_tenant_slug") : null);

  useEffect(() => {
    if (canonicalRole === "SUPER_ADMIN" && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("mbyte_tenant_slug");
      } catch {}
    } else if ((currentUser?.organization?.slug || userOrgSlug) && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("mbyte_tenant_slug", currentUser?.organization?.slug || userOrgSlug || "");
      } catch {}
    }
  }, [canonicalRole, currentUser?.organization?.slug, userOrgSlug]);

  useEffect(() => {
    // Forward tenant users to their dedicated tenant subdomain portal if on root platform domain
    if (
      currentUser &&
      canonicalRole !== "SUPER_ADMIN" &&
      userOrgSlug &&
      currentSubdomain !== userOrgSlug &&
      typeof window !== "undefined"
    ) {
      // Never carry super admin paths (/companies, /admin) into the tenant subdomain!
      const safePath = pathname.startsWith("/companies") || pathname.startsWith("/admin") ? "/" : pathname;
      const destination = buildTenantSubdomainUrl(userOrgSlug, safePath);
      if (window.location.href !== destination) {
        window.location.href = destination;
      }
    }
  }, [currentUser, canonicalRole, userOrgSlug, currentSubdomain, pathname]);

  useEffect(() => {
    // Route Super Admin back to central platform if they are on a tenant subdomain
    if (
      currentUser &&
      canonicalRole === "SUPER_ADMIN" &&
      currentSubdomain &&
      typeof window !== "undefined"
    ) {
      const rootDomain = getRootDomain();
      const rootHost = rootDomain.split(":")[0];
      if (window.location.hostname !== rootHost && window.location.hostname !== `www.${rootHost}`) {
        window.location.href = `https://${rootDomain}/companies`;
      }
    }
  }, [currentUser, canonicalRole, currentSubdomain]);

  // Check Role Route Authorization
  const isSuperAdminRoute = pathname.startsWith("/companies");
  const isBlockedSuperAdmin = Boolean(currentUser) && isSuperAdminRoute && canonicalRole !== "SUPER_ADMIN";

  const isBlockedOperationalForSuperAdmin =
    Boolean(currentUser) &&
    canonicalRole === "SUPER_ADMIN" &&
    SUPER_ADMIN_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const isBlockedMR =
    Boolean(currentUser) &&
    canonicalRole === "MR" &&
    MR_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const blockedFeature =
    Boolean(currentUser) &&
    canonicalRole !== "SUPER_ADMIN" &&
    currentUser?.features
      ? FEATURE_ROUTE_MAPPING.find(
          (m) => pathname.startsWith(m.prefix) && currentUser.features?.[m.featureKey] === false,
        )
      : null;

  if (!authChecked || (isLoading && !currentUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCF7F2] dark:bg-[#171717]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Restoring platform session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell relative min-h-screen bg-[#FCF7F2] dark:bg-[#171717] overflow-x-hidden selection:bg-orange-500 selection:text-white">
      <Suspense fallback={<div className="w-16 lg:w-64" />}>
        <Sidebar />
      </Suspense>
      <div
        className={cn(
          "relative z-10 flex min-h-screen flex-col transition-all duration-300 ease-in-out min-w-0 max-w-full overflow-x-clip",
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
                    href={userOrgSlug ? buildTenantSubdomainUrl(userOrgSlug, "/") : "/"}
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
            ) : blockedFeature ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20 shadow-xs">
                <ShieldAlert className="mx-auto h-12 w-12 text-red-600 dark:text-red-400 mb-3" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Feature Deactivated: {blockedFeature.label}
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  This module has been deactivated for your organization or user account by platform governance. Contact your company administrator to request access.
                </p>
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to Dashboard</span>
                  </Link>
                </div>
              </div>
            ) : (
              <PageTransition>{children}</PageTransition>
            )}
          </div>
        </main>
      </div>


    </div>
  );
}
