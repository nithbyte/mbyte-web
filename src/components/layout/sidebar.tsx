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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store";
import { useCurrentUser, useLogout } from "@/hooks";
import { normalizeRole, getRoleLabel, type CanonicalRole } from "@/types";
import { APP_CONFIG } from "@/lib/constants";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "live" | "count";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function getNavSections(role: CanonicalRole): NavSection[] {
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
            },
            {
              title: "Pharmacies & Retail",
              href: "/pharmacies",
              icon: Building2,
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
            },
            {
              title: "Orders Booking",
              href: "/orders",
              icon: ShoppingCart,
            },
            {
              title: "Collections & Receipts",
              href: "/collections",
              icon: Receipt,
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
              title: "Product Presence Intel",
              href: "/product-presence",
              icon: MapPin,
              badge: "LIVE",
              badgeVariant: "live",
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
            },
            {
              title: "Pharmacies & Retail",
              href: "/pharmacies",
              icon: Building2,
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
            },
            {
              title: "Collections & Receipts",
              href: "/collections",
              icon: Receipt,
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
              title: "Product Presence",
              href: "/product-presence",
              icon: MapPin,
              badge: "LIVE",
              badgeVariant: "live",
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogout();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } =
    useSidebarStore();
  const { data: currentUser } = useCurrentUser();

  const canonicalRole = normalizeRole(currentUser?.role);
  const navSections = getNavSections(canonicalRole);

  const userName = currentUser?.name || "Field User";
  const userRole = getRoleLabel(canonicalRole);
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MB";

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.push("/login");
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Brand & Organization */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800">
          <Link
            href={canonicalRole === "SUPER_ADMIN" ? "/companies" : canonicalRole === "MR" ? "/visits" : "/"}
            className="flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 shadow-md shadow-sky-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 truncate">
                  {canonicalRole === "SUPER_ADMIN"
                    ? "Platform Control"
                    : currentUser?.organizationId === "org_apex_002" ||
                      currentUser?.organizationId === "31524081-7b14-4925-a331-e4cd05a62e04"
                    ? "Apex Healthcare"
                    : "Novis Pharma"}
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section List */}
        <div className="space-y-6 px-3 py-4 overflow-y-auto max-h-[calc(100vh-14rem)]">
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
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={isCollapsed ? item.title : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-sky-50 font-semibold text-sky-700 shadow-sm dark:bg-sky-950/60 dark:text-sky-300"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
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
      </div>

      {/* Footer, Profile & Logout */}
      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-800/80">
            <div suppressHydrationWarning className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300 shrink-0">
              {initials}
            </div>
            <div className="flex flex-col truncate flex-1 min-w-0">
              <span suppressHydrationWarning className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {userName}
              </span>
              <span suppressHydrationWarning className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate">
                {userRole}
              </span>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer",
            isCollapsed && "justify-center px-0"
          )}
          title="Sign Out of Portal"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "hidden lg:flex w-full items-center justify-center rounded-lg py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
            isCollapsed ? "px-0" : "gap-2 px-3"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl dark:bg-slate-900">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
