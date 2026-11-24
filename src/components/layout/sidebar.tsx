"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  CalendarCheck,
  ShoppingCart,
  Receipt,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
  X,
  Truck,
  MapPin,
  TrendingUp,
  LogOut,
  FolderLock,
  CalendarDays,
  FileCheck,
  FlaskConical,
  Wallet,
  FileSpreadsheet,
  Clock,
  Flag,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore, useAuthStore } from "@/store";
import { useCurrentUser, useLogout } from "@/hooks";
import { normalizeRole, type CanonicalRole, type AppFeatures } from "@/types";
import { APP_CONFIG } from "@/lib/constants";
import { MByteLogo } from "@/components/ui/mbyte-logo";
import { buildRootLoginUrl, getTenantSubdomain } from "@/lib/subdomain";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "live" | "count";
  featureKey?: keyof AppFeatures;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function getRawNavSections(role: CanonicalRole): NavSection[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        {
          title: "Platform Governance",
          items: [
            {
              title: "Companies & Tenants",
              href: "/companies",
              icon: Building2,
              badge: "GLOBAL",
              badgeVariant: "live",
            },
            {
              title: "Company Administrators",
              href: "/field-force",
              icon: Users,
            },
            {
              title: "Team Chat & Calls",
              href: "/chat",
              icon: MessageSquare,
            },
            {
              title: "Announcements",
              href: "/announcements",
              icon: Megaphone,
            },
          ],
        },
        {
          title: "Platform System",
          items: [
            {
              title: "Global Settings",
              href: "/settings",
              icon: Settings,
            },
          ],
        },
      ];

    case "ADMIN":
      return [
        {
          title: "Operations",
          items: [
            {
              title: "Company Overview",
              href: "/",
              icon: LayoutDashboard,
            },
            {
              title: "Field Visits & GPS",
              href: "/visits",
              icon: CalendarCheck,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "geomapping",
            },
            {
              title: "Live MR Tracking",
              href: "/live-tracking",
              icon: Radio,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "geomapping",
            },
            {
              title: "Tour Plans (MTP)",
              href: "/tour-plans",
              icon: CalendarDays,
              featureKey: "tourPlanning",
            },
            {
              title: "Daily Call Reports (DCR)",
              href: "/dcr",
              icon: FileCheck,
              featureKey: "dcrFiling",
            },
          ],
        },
        {
          title: "Field Force",
          items: [
            {
              title: "MR Team & Coverage",
              href: "/field-force",
              icon: Users,
            },
            {
              title: "Territories & Coverage",
              href: "/territories",
              icon: MapPin,
            },
          ],
        },
        {
          title: "Customer Master",
          items: [
            {
              title: "Doctors & Clinics",
              href: "/doctors",
              icon: Stethoscope,
              featureKey: "doctorManagement",
            },
            {
              title: "Purchasing Doctors",
              href: "/purchasing-doctors",
              icon: Stethoscope,
              featureKey: "doctorManagement",
            },
            {
              title: "Pharmacies & Retail",
              href: "/pharmacies",
              icon: Building2,
              featureKey: "chemistManagement",
            },
            {
              title: "Distributors & Stockists",
              href: "/distributors",
              icon: Truck,
            },
          ],
        },
        {
          title: "Commercial",
          items: [
            {
              title: "Commercial Overview",
              href: "/commercial",
              icon: TrendingUp,
              featureKey: "orderBooking",
            },
            {
              title: "Orders Booking",
              href: "/orders",
              icon: ShoppingCart,
              featureKey: "orderBooking",
            },
            {
              title: "Collections & Receipts",
              href: "/collections",
              icon: Receipt,
              featureKey: "collections",
            },
            {
              title: "Expense Claims",
              href: "/expenses",
              icon: Wallet,
              featureKey: "expenseManagement",
            },
            {
              title: "Accounts Receivable",
              href: "/receivables",
              icon: FileSpreadsheet,
              featureKey: "collections",
            },
          ],
        },
        {
          title: "Catalog & Inventory",
          items: [
            {
              title: "Products & Visual Aids",
              href: "/products",
              icon: Package,
            },
            {
              title: "Sample Inventory & Ledger",
              href: "/samples",
              icon: FlaskConical,
              featureKey: "sampleTracking",
            },
            {
              title: "Product Presence Intel",
              href: "/products/presence",
              icon: MapPin,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "productPresence",
            },
          ],
        },
        {
          title: "Field & Engagement",
          items: [
            {
              title: "Team Chat & Calls",
              href: "/chat",
              icon: MessageSquare,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "chatAndCalling",
            },
            {
              title: "Announcements",
              href: "/announcements",
              icon: Megaphone,
              featureKey: "chatAndCalling",
            },
            {
              title: "Shift Attendance",
              href: "/attendance",
              icon: Clock,
              featureKey: "leaveManagement",
            },
            {
              title: "Company Campaigns",
              href: "/campaigns",
              icon: Flag,
            },
            {
              title: "Training & Quizzes",
              href: "/training",
              icon: GraduationCap,
            },
            {
              title: "Surveys & Feedback",
              href: "/surveys",
              icon: ClipboardList,
            },
          ],
        },
        {
          title: "Management",
          items: [
            {
              title: "Reports & Analytics",
              href: "/reports",
              icon: BarChart3,
            },
            {
              title: "System Settings",
              href: "/settings",
              icon: Settings,
            },
          ],
        },
      ];

    case "TERRITORY_MANAGER":
      return [
        {
          title: "Territory Operations",
          items: [
            {
              title: "Territory Overview",
              href: "/",
              icon: LayoutDashboard,
            },
            {
              title: "Visits & GPS Tracking",
              href: "/visits",
              icon: CalendarCheck,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "geomapping",
            },
            {
              title: "Live MR Tracking",
              href: "/live-tracking",
              icon: Radio,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "geomapping",
            },
            {
              title: "Tour Plans (MTP)",
              href: "/tour-plans",
              icon: CalendarDays,
              featureKey: "tourPlanning",
            },
            {
              title: "Daily Call Reports (DCR)",
              href: "/dcr",
              icon: FileCheck,
              featureKey: "dcrFiling",
            },
          ],
        },
        {
          title: "Field Team",
          items: [
            {
              title: "Assigned MRs & Coverage",
              href: "/field-force",
              icon: Users,
            },
          ],
        },
        {
          title: "Territory Customers",
          items: [
            {
              title: "Doctors & Clinics",
              href: "/doctors",
              icon: Stethoscope,
              featureKey: "doctorManagement",
            },
            {
              title: "Purchasing Doctors",
              href: "/purchasing-doctors",
              icon: Stethoscope,
              featureKey: "doctorManagement",
            },
            {
              title: "Pharmacies & Retail",
              href: "/pharmacies",
              icon: Building2,
              featureKey: "chemistManagement",
            },
            {
              title: "Distributors & Stockists",
              href: "/distributors",
              icon: Truck,
            },
          ],
        },
        {
          title: "Commercial",
          items: [
            {
              title: "Territory Orders",
              href: "/orders",
              icon: ShoppingCart,
              featureKey: "orderBooking",
            },
            {
              title: "Collections & Receipts",
              href: "/collections",
              icon: Receipt,
              featureKey: "collections",
            },
            {
              title: "Expense Claims",
              href: "/expenses",
              icon: Wallet,
              featureKey: "expenseManagement",
            },
            {
              title: "Accounts Receivable",
              href: "/receivables",
              icon: FileSpreadsheet,
              featureKey: "collections",
            },
          ],
        },
        {
          title: "Catalog & Market",
          items: [
            {
              title: "Products & Visual Aids",
              href: "/products",
              icon: Package,
            },
            {
              title: "Sample Inventory & Ledger",
              href: "/samples",
              icon: FlaskConical,
              featureKey: "sampleTracking",
            },
            {
              title: "Product Presence",
              href: "/products/presence",
              icon: MapPin,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "productPresence",
            },
          ],
        },
        {
          title: "Field & Engagement",
          items: [
            {
              title: "Team Chat & Calls",
              href: "/chat",
              icon: MessageSquare,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "chatAndCalling",
            },
            {
              title: "Announcements",
              href: "/announcements",
              icon: Megaphone,
              featureKey: "chatAndCalling",
            },
            {
              title: "Shift Attendance",
              href: "/attendance",
              icon: Clock,
              featureKey: "leaveManagement",
            },
            {
              title: "Company Campaigns",
              href: "/campaigns",
              icon: Flag,
            },
            {
              title: "Training & Quizzes",
              href: "/training",
              icon: GraduationCap,
            },
            {
              title: "Surveys & Feedback",
              href: "/surveys",
              icon: ClipboardList,
            },
          ],
        },
        {
          title: "Management",
          items: [
            {
              title: "Territory Reports",
              href: "/reports",
              icon: BarChart3,
            },
            {
              title: "Account Settings",
              href: "/settings",
              icon: Settings,
            },
          ],
        },
      ];

    case "MR":
      return [
        {
          title: "My Field Work",
          items: [
            {
              title: "Team Chat & Calls",
              href: "/chat",
              icon: MessageSquare,
              badge: "LIVE",
              badgeVariant: "live",
              featureKey: "chatAndCalling",
            },
            {
              title: "Announcements",
              href: "/announcements",
              icon: Megaphone,
              featureKey: "chatAndCalling",
            },
            {
              title: "My Call Schedule & Visits",
              href: "/visits",
              icon: CalendarCheck,
              badge: "LIVE",
              badgeVariant: "live",
            },
            {
              title: "Visual Aids & Catalog",
              href: "/products",
              icon: Package,
            },
          ],
        },
        {
          title: "Personal",
          items: [
            {
              title: "Profile & Settings",
              href: "/settings",
              icon: Settings,
            },
          ],
        },
      ];
  }
}

function getNavSections(role: CanonicalRole, features?: AppFeatures): NavSection[] {
  const sections = getRawNavSections(role);
  if (role === "SUPER_ADMIN" || !features) {
    return sections;
  }
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.featureKey || features[item.featureKey] !== false),
    }))
    .filter((section) => section.items.length > 0);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogout();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } =
    useSidebarStore();
  const storeUser = useAuthStore((s) => s.user);
  const { data: fetchedUser } = useCurrentUser();
  const currentUser = fetchedUser ?? storeUser;

  const canonicalRole = normalizeRole(currentUser?.role);
  const navSections = getNavSections(canonicalRole, currentUser?.features);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      if (typeof window !== "undefined") {
        const currentSubdomain = getTenantSubdomain();
        const rootLoginUrl = buildRootLoginUrl(currentSubdomain);
        const url = new URL(rootLoginUrl);
        url.searchParams.set("logged_out", "1");
        window.location.replace(url.toString());
      }
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand & Organization Header */}
      <div
        className={cn(
          "relative flex h-16 shrink-0 items-center border-b border-[#E5E1D9] dark:border-[#333333]",
          isCollapsed ? "justify-center px-1.5" : "justify-between px-3.5"
        )}
      >
        <Link
          href={canonicalRole === "SUPER_ADMIN" ? "/companies" : canonicalRole === "MR" ? "/visits" : "/"}
          className={cn(
            "flex items-center transition-opacity hover:opacity-90 min-w-0 flex-1",
            isCollapsed ? "justify-center" : "gap-2"
          )}
          title={isCollapsed ? "MByte FieldOps" : undefined}
        >
          {isCollapsed ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <MByteLogo variant="icon" width={32} height={32} priority />
            </div>
          ) : (
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <MByteLogo variant="compact" width={118} height={26} priority />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] dark:bg-[#FF6B00]/10 dark:text-[#FF6B00] border border-orange-200 dark:border-orange-900/60 shrink-0">
                  FieldOps
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {canonicalRole === "SUPER_ADMIN"
                  ? "Platform Control"
                  : currentUser?.organization?.name ||
                    currentUser?.organizationName ||
                    currentUser?.companyName ||
                    (currentUser?.organizationId ? "Corporate Operations" : "Field Operations")}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Arrow (<) next to MByte Logo when expanded */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:border-[#E5E1D9] hover:bg-slate-100 hover:text-slate-700 dark:hover:border-[#333333] dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Desktop Expand Arrow (>) cleanly on sidebar edge when collapsed so MByte icon is never clipped */}
        {isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-40 h-6 w-6 items-center justify-center rounded-full border border-[#E5E1D9] bg-white text-slate-500 shadow-sm hover:border-[#FF6B00]/40 hover:text-[#FF6B00] dark:border-[#333333] dark:bg-[#242424] dark:text-slate-300 transition-colors cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Close button for mobile drawer */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Section List (scrollable, scrollbar completely hidden) */}
      <div className="flex-1 min-h-0 space-y-6 px-3 py-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <p suppressHydrationWarning className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}

              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/" || item.href === "/dashboard"
                      ? pathname === "/" || pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        setMobileOpen(false);
                        if (item.href === "/chat" && isActive) {
                          e.preventDefault();
                          const fallback = canonicalRole === "SUPER_ADMIN" ? "/companies" : "/";
                          const prevRoute =
                            typeof window !== "undefined"
                              ? sessionStorage.getItem("mbyte_prev_non_chat_route")
                              : null;
                          const target =
                            prevRoute && !prevRoute.startsWith("/chat") ? prevRoute : fallback;
                          router.push(target);
                        }
                      }}
                      title={isCollapsed ? item.title : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                        isActive
                          ? "bg-orange-50/90 font-bold text-[#FF6B00] border border-orange-200/90 shadow-none dark:bg-[#FF6B00]/15 dark:border-orange-500/30 dark:text-[#FF6B00]"
                          : "border border-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive
                            ? "text-[#FF6B00] dark:text-[#FF6B00]"
                            : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"
                        )}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
                            item.badgeVariant === "live"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 animate-pulse dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}
                        >
                          {item.badgeVariant === "live" && (
                            <Radio className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
      </div>

      {/* Footer & Logout */}
      <div className="shrink-0 border-t border-white/60 p-3 dark:border-white/10">
        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold text-rose-600 border border-rose-200/60 bg-rose-50/40 backdrop-blur-xl hover:bg-rose-100/60 hover:border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40 shadow-xs transition-all cursor-pointer",
            isCollapsed && "justify-center px-0"
          )}
          title="Sign Out of Portal"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {!isCollapsed && (
          <div className="mt-2.5 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Powered by{" "}
              <a
                href="https://nithbyte.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-600 dark:text-slate-300 hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors"
              >
                Nithbyte
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 border-r border-white/60 bg-white/80 backdrop-blur-2xl transition-all duration-300 ease-in-out dark:border-white/10 dark:bg-[#1a1a1a]/80 shadow-[0_4px_24px_0_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.3)]",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-2xl shadow-2xl dark:bg-[#1a1a1a]/95 dark:border-r dark:border-white/10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
