"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  Search,
  MapPin,
  Building,
  ChevronDown,
  Mail,
  Shield,
  Briefcase,
  IdCard,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { useSidebarStore, useFilterStore, useAuthStore } from "@/store";
import {
  useTerritories,
  useCurrentUser,
  useLogout,
  useIsMounted,
  useUnreadNotificationsCount,
} from "@/hooks";
import { normalizeRole, getRoleLabel, type CanonicalRole } from "@/types";
import { Modal } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationDropdown } from "./notification-dropdown";
import { GlobalSearch } from "./global-search";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { getLocalTodayDate, getLocalYesterdayDate, isValidIsoDate, cn } from "@/lib/utils";
import { getRootDomain } from "@/lib/subdomain";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isMounted = useIsMounted();
  const { toggleMobileOpen } = useSidebarStore();
  const { selectedTerritoryId, setSelectedTerritoryId, operatingDate, setOperatingDate } = useFilterStore();
  const { data: territories } = useTerritories();
  const storeUser = useAuthStore((s) => s.user);
  const { data: fetchedUser, refetch: refetchCurrentUser } = useCurrentUser();
  const currentUser = fetchedUser ?? storeUser;
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();
  const logoutMutation = useLogout();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const lastSyncedUrlDateRef = useRef<string | null>(null);
  const lastSyncedUrlTerritoryRef = useRef<string | null>(null);

  // Compute local dates when mounted in the browser
  const todayDate = isMounted ? getLocalTodayDate() : "";
  const yesterdayDate = isMounted ? getLocalYesterdayDate() : "";

  // URL query parameter synchronization (?date=YYYY-MM-DD and ?territory=<id>)
  // Only react when the URL param itself changes (never revert local selection!)
  const urlDateParam = searchParams?.get("date") ?? null;
  useEffect(() => {
    if (urlDateParam && urlDateParam !== lastSyncedUrlDateRef.current) {
      lastSyncedUrlDateRef.current = urlDateParam;
      if (isValidIsoDate(urlDateParam)) {
        setOperatingDate(urlDateParam);
      }
    }
  }, [urlDateParam, setOperatingDate]);

  const urlTerritoryParam = searchParams?.get("territory") ?? null;
  useEffect(() => {
    if (urlTerritoryParam && urlTerritoryParam !== lastSyncedUrlTerritoryRef.current) {
      lastSyncedUrlTerritoryRef.current = urlTerritoryParam;
      setSelectedTerritoryId(urlTerritoryParam);
    }
  }, [urlTerritoryParam, setSelectedTerritoryId]);

  const handleTerritoryChange = (newTerritoryId: string) => {
    lastSyncedUrlTerritoryRef.current = newTerritoryId;
    setSelectedTerritoryId(newTerritoryId);

    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (newTerritoryId === "ALL") {
      params.delete("territory");
    } else {
      params.set("territory", newTerritoryId);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleDateChange = (newDate: string) => {
    if (!newDate || !isValidIsoDate(newDate)) return;
    lastSyncedUrlDateRef.current = newDate;
    setOperatingDate(newDate);

    // Update URL parameter without reload
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (params.get("date") !== newDate) {
      params.set("date", newDate);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const canonicalRole = normalizeRole(currentUser?.role);
  const isChatOpen = pathname === "/chat" || pathname.startsWith("/chat/");

  // Track last visited non-chat route so toggling/closing Chat returns cleanly
  useEffect(() => {
    if (!isChatOpen && pathname && typeof window !== "undefined") {
      const qs = searchParams?.toString();
      const fullPath = qs ? `${pathname}?${qs}` : pathname;
      sessionStorage.setItem("mbyte_prev_non_chat_route", fullPath);
    }
  }, [isChatOpen, pathname, searchParams]);

  const handleToggleChat = () => {
    if (isChatOpen) {
      const fallback = canonicalRole === "SUPER_ADMIN" ? "/companies" : "/";
      const prevRoute =
        typeof window !== "undefined"
          ? sessionStorage.getItem("mbyte_prev_non_chat_route")
          : null;
      const target = prevRoute && !prevRoute.startsWith("/chat") ? prevRoute : fallback;
      router.push(target);
    } else {
      router.push("/chat");
    }
  };
  const userName = currentUser?.name || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim() || "Loading...";
  const userRole = getRoleLabel(canonicalRole);
  const initials =
    userName === "Loading..."
      ? "MB"
      : userName
          .split(" ")
          .map((part) => part[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase() || "MB";

  const tenantCompanyName =
    canonicalRole === "SUPER_ADMIN"
      ? "Platform Control"
      : currentUser?.organization?.name ||
      currentUser?.organizationName ||
      currentUser?.companyName ||
      (currentUser?.organizationId === "org_apex_002" ||
        currentUser?.organizationId === "31524081-7b14-4925-a331-e4cd05a62e04"
        ? "Apex Healthcare"
        : currentUser?.organizationId === "org_novis_001" ||
          currentUser?.organizationId === "28101346-8d53-4e0e-9433-feec8dbfeb28"
          ? "Novis Pharma"
          : currentUser?.organizationId
            ? "Corporate Enterprise"
            : "Field Operations");

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setIsProfileModalOpen(false);
      if (typeof window !== "undefined") {
        const rootDomain = getRootDomain();
        const rootHost = rootDomain.split(":")[0];
        window.location.href = `https://${rootHost}/login`;
      }
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
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-white/60 bg-white/80 px-3 sm:px-4 backdrop-blur-2xl dark:border-white/10 dark:bg-[#1a1a1a]/80 lg:px-6 2xl:px-8 gap-2 sm:gap-4 transition-all">
        {/* Left: Mobile Toggle, Territory Filter & Date Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={toggleMobileOpen}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-[#F5F3EE] dark:text-slate-300 dark:hover:bg-[#2C2C2C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:focus-visible:ring-[#FF6B00] shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Territory Selector */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/60 px-2 sm:px-2.5 py-1 text-xs shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 shrink">
            <MapPin className="h-3.5 w-3.5 text-[#FF6B00] shrink-0" aria-hidden="true" />
            <label htmlFor="header-territory-select" className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 hidden md:inline">
              Territory:
            </label>
            <select
              id="header-territory-select"
              aria-label="Filter territory"
              value={selectedTerritoryId}
              onChange={(e) => handleTerritoryChange(e.target.value)}
              suppressHydrationWarning
              className="bg-transparent font-medium text-slate-900 focus:outline-none dark:text-slate-100 cursor-pointer text-xs max-w-[100px] sm:max-w-[130px] md:max-w-[160px] truncate"
            >
              <option value="ALL" className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
                All Authorized Territories
              </option>
              {isMounted &&
                territories?.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
                    {t.name} ({t.code})
                  </option>
                ))}
            </select>
          </div>

          {/* Operating Date Selector & Context Controls */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/80 bg-white/60 p-1 text-xs shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 shrink">
            <div className="flex items-center gap-1 px-1 text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-[#FF6B00] shrink-0" aria-hidden="true" />
              <label htmlFor="header-operating-date" className="font-semibold hidden 2xl:inline text-slate-600 dark:text-slate-300">
                Date:
              </label>
            </div>

            {/* Today Shortcut Button */}
            <button
              type="button"
              onClick={() => handleDateChange(getLocalTodayDate())}
              className={cn(
                "rounded-lg px-2 py-0.5 text-xs font-medium transition-all cursor-pointer",
                todayDate && operatingDate === todayDate
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/15 border border-orange-500/35 font-bold text-[#FF6B00] shadow-xs backdrop-blur-md dark:bg-[#FF6B00]/20"
                  : "text-slate-600 hover:bg-white/70 hover:backdrop-blur-md dark:text-slate-300 dark:hover:bg-white/10"
              )}
              title="Set operating date to Today"
            >
              Today
            </button>

            {/* Yesterday Shortcut Button */}
            <button
              type="button"
              onClick={() => handleDateChange(getLocalYesterdayDate())}
              className={cn(
                "hidden xl:inline-block rounded-lg px-2 py-0.5 text-xs font-medium transition-all cursor-pointer",
                yesterdayDate && operatingDate === yesterdayDate
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/15 border border-orange-500/35 font-bold text-[#FF6B00] shadow-xs backdrop-blur-md dark:bg-[#FF6B00]/20"
                  : "text-slate-600 hover:bg-white/70 hover:backdrop-blur-md dark:text-slate-300 dark:hover:bg-white/10"
              )}
              title="Set operating date to Yesterday"
            >
              Yesterday
            </button>

            {/* Native Date Picker */}
            <input
              id="header-operating-date"
              type="date"
              aria-label="Filter by operating date"
              value={operatingDate}
              onChange={(e) => {
                if (e.target.value) {
                  handleDateChange(e.target.value);
                }
              }}
              suppressHydrationWarning
              className="w-[122px] rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xs font-semibold text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:text-slate-100 dark:hover:border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Center: Flexible Global Search Bar */}
        <div className="hidden lg:flex flex-1 items-center justify-center max-w-sm xl:max-w-md 2xl:max-w-lg mx-2 min-w-[240px]">
          <GlobalSearch role={canonicalRole} />
        </div>

        {/* Right: Tenant Badge, Notifications & User Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tenant Organization Tag */}
          <div className="hidden 2xl:flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#FF6B00] dark:border-orange-900/60 dark:bg-[#FF6B00]/10 dark:text-[#FF6B00] shrink-0 max-w-[140px]">
            <Building className="h-3.5 w-3.5 text-[#FF6B00] shrink-0" aria-hidden="true" />
            <span suppressHydrationWarning className="truncate">{tenantCompanyName}</span>
          </div>

          {/* Light / Dark Theme Mode Toggle */}
          <ThemeToggle />

          {/* Team Chat Quick Access Toggle */}
          <button
            type="button"
            onClick={handleToggleChat}
            className={cn(
              "relative rounded-xl border border-white/70 bg-white/60 backdrop-blur-xl p-2 text-slate-600 hover:bg-white/90 hover:border-white shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] shrink-0 transition-all cursor-pointer",
              isChatOpen && "bg-gradient-to-r from-orange-500/20 to-amber-500/15 border-orange-500/35 text-[#FF6B00] dark:bg-[#FF6B00]/20 dark:text-[#FF6B00]"
            )}
            title={isChatOpen ? "Close Team Chat & Calls" : "Team Chat & Calls"}
            aria-label={isChatOpen ? "Close Team Chat & Calls" : "Open Team Chat & Calls"}
            aria-pressed={isChatOpen}
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Notification Bell with Popover Dropdown */}
          <div className="relative shrink-0">
            <button
              ref={notificationButtonRef}
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={cn(
                "relative rounded-xl border border-white/70 bg-white/60 backdrop-blur-xl p-2 text-slate-600 hover:bg-white/90 hover:border-white shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] shrink-0 transition-all cursor-pointer",
                isNotificationOpen && "bg-gradient-to-r from-orange-500/20 to-amber-500/15 border-orange-500/35 text-[#FF6B00]"
              )}
              aria-label="View notifications"
              title="View notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              anchorRef={notificationButtonRef}
            />
          </div>

          {/* User Profile Pill */}
          <button
            onClick={() => {
              refetchCurrentUser();
              setIsProfileModalOpen(true);
            }}
            aria-label="User Profile and Account Details"
            suppressHydrationWarning
            className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl px-2.5 py-1 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/90 hover:border-white dark:border-white/10 dark:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] shrink-0 cursor-pointer"
          >
            <div suppressHydrationWarning className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#F45100] text-xs font-bold text-white shadow-xs shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left max-w-[100px] 2xl:max-w-[130px]">
              <div className="flex items-center gap-1">
                <span suppressHydrationWarning className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">
                  {userName}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
              </div>
              <span suppressHydrationWarning className="text-[10px] font-medium uppercase tracking-wider text-[#FF6B00] dark:text-[#FF6B00] truncate">
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
          <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-[#123261] bg-slate-50 dark:bg-[#0b2247]/60">
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
                {(currentUser as any)?.designation ||
                  (currentUser as any)?.mrProfile?.designation ||
                  (currentUser as any)?.medicalRepresentative?.designation ||
                  userRole}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <IdCard className="h-3.5 w-3.5" />
                <span>Employee Identification:</span>
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-white">
                {(currentUser as any)?.employeeCode ||
                  (currentUser as any)?.employeeId ||
                  (currentUser as any)?.mrProfile?.employeeCode ||
                  (currentUser as any)?.medicalRepresentative?.employeeCode ||
                  "—"}
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
