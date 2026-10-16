"use client";

import React, { useState } from "react";
import {
  Menu,
  Bell,
  Search,
  MapPin,
  Building,
  ChevronDown,
  User as UserIcon,
  Mail,
  Shield,
  Briefcase,
  IdCard,
} from "lucide-react";
import { useSidebarStore, useFilterStore } from "@/store";
import { useTerritories, useCurrentUser, useLogout, useIsMounted } from "@/hooks";
import { normalizeRole, getRoleLabel, type CanonicalRole } from "@/types";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { toggleMobileOpen } = useSidebarStore();
  const { selectedTerritoryId, setSelectedTerritoryId } = useFilterStore();
  const { data: territories } = useTerritories();
  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const canonicalRole = normalizeRole(currentUser?.role);
  const userName = currentUser?.name || "Field User";
  const userRole = getRoleLabel(canonicalRole);
  const initials =
    userName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MB";

  const tenantCompanyName =
    canonicalRole === "SUPER_ADMIN"
      ? "Platform Control"
      : currentUser?.organizationId === "org_apex_002" ||
        currentUser?.organizationId === "31524081-7b14-4925-a331-e4cd05a62e04"
      ? "Apex Healthcare"
      : "Novis Pharma";

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setIsProfileModalOpen(false);
      router.push("/login");
    }
  };

  const getBadgeStyle = (role: CanonicalRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "ADMIN":
        return "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800";
      case "TERRITORY_MANAGER":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "MR":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:px-8">
        {/* Left: Mobile Toggle, Territory Filter & Date Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={toggleMobileOpen}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Territory Selector */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-900/90 shrink-0">
            <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
            <label htmlFor="header-territory-select" className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              Territory:
            </label>
            <select
              id="header-territory-select"
              aria-label="Filter territory"
              value={selectedTerritoryId}
              onChange={(e) => setSelectedTerritoryId(e.target.value)}
              suppressHydrationWarning
              className="bg-transparent font-medium text-slate-900 focus:outline-none dark:text-slate-100 cursor-pointer text-xs max-w-[150px] md:max-w-[180px] lg:max-w-[220px] truncate"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                All Authorized Territories
              </option>
              {isMounted &&
                territories?.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {t.name} ({t.code})
                  </option>
                ))}
            </select>
          </div>

          {/* Date Context Badge */}
          <div className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/90 px-3 py-1.5 text-xs text-slate-700 shadow-xs dark:border-slate-700/80 dark:bg-slate-800/95 dark:text-slate-200 shrink-0 whitespace-nowrap">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 dark:text-slate-100">Oct 2026</span>
            <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">Live Field Ops</span>
          </div>
        </div>

        {/* Right: Search, Notifications & User Info */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Search trigger */}
          <div className="relative hidden xl:block w-52 2xl:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              aria-label="Search portal records"
              placeholder="Search doctors, chemist, orders..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Tenant Organization Tag */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/70 dark:text-sky-300 shrink-0">
            <Building className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span>{tenantCompanyName}</span>
          </div>

          {/* Notification Bell */}
          <button
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
          </button>

          {/* User Profile Pill */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            aria-label="User Profile and Account Details"
            suppressHydrationWarning
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80 dark:border-slate-800 hover:opacity-85 transition-opacity text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg py-1 px-1.5 shrink-0 cursor-pointer"
          >
            <div suppressHydrationWarning className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-xs font-bold text-white shadow-xs shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span suppressHydrationWarning className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {userName}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
              </div>
              <span suppressHydrationWarning className="text-[10px] font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
                {userRole}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Production User Profile & Account Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Corporate Account & Profile"
        description="Authenticated corporate field-force identity and tenant session details."
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* User Identity Card */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 font-bold text-sm text-white shadow-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {userName}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getBadgeStyle(canonicalRole)}`}>
                  {userRole}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{currentUser?.email || "user@pharma.com"}</span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Building className="h-3.5 w-3.5" />
                <span>Pharmaceutical Company:</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{tenantCompanyName}</span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Tenant Isolation Boundary:</span>
              </span>
              <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                {currentUser?.organizationId || "System Global"}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Designation:</span>
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {currentUser?.designation || userRole}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <IdCard className="h-3.5 w-3.5" />
                <span>Employee Identification:</span>
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-white">
                {currentUser?.employeeId || "EMP-001"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
