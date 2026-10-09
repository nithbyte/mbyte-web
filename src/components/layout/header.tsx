"use client";

import React, { useState } from "react";
import {
  Menu,
  Bell,
  Search,
  MapPin,
  Calendar,
  Building,
  ChevronDown,
  Check,
} from "lucide-react";
import { useSidebarStore, useFilterStore } from "@/store";
import { useTerritories, useCurrentUser, useUserList, useSwitchUser, useIsMounted } from "@/hooks";
import { APP_CONFIG } from "@/lib/constants";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const isMounted = useIsMounted();
  const { toggleMobileOpen } = useSidebarStore();
  const { selectedTerritoryId, setSelectedTerritoryId } = useFilterStore();
  const { data: territories } = useTerritories();
  const { data: currentUser } = useCurrentUser();
  const { data: userList } = useUserList();
  const switchUserMutation = useSwitchUser();

  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  // Derive display initials and name
  const userName = currentUser?.name || "Field Manager";
  const userRole = currentUser?.designation || currentUser?.role || "Area Manager";
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "FM";

  const handleSelectUser = async (userId: string) => {
    await switchUserMutation.mutateAsync(userId);
    setIsUserSwitcherOpen(false);
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
                All Territories (All Tamil Nadu)
              </option>
              {isMounted &&
                territories?.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {t.name} ({t.code})
                  </option>
                ))}
            </select>
          </div>

          {/* Date Context Badge - High Contrast, Never Wraps, Perfectly Aligned */}
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
            <span>{APP_CONFIG.organization}</span>
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

          {/* User Profile Pill & Switcher Trigger */}
          <button
            onClick={() => setIsUserSwitcherOpen(true)}
            aria-label={`Current user: ${userName}. Click to switch persona`}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80 dark:border-slate-800 hover:opacity-85 transition-opacity text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg py-1 px-1.5 shrink-0"
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

      {/* User Switcher Persona Modal */}
      <Modal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        title="Active User Persona"
        description="Switch between field managers and regional administrators to audit role privileges."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
            <span className="font-semibold">Active Session:</span> {userName} ({userRole})
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {userList?.map((user) => {
              const isSelected = user.id === currentUser?.id;
              const itemInitials = (user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email)
                .split(" ")
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  disabled={switchUserMutation.isPending}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/70 shadow-xs dark:bg-sky-950/40"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {itemInitials}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {user.designation || user.role} • {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "MANAGER" ? "default" : "secondary"} className="text-[10px]">
                      {user.role}
                    </Badge>
                    {isSelected && <Check className="h-4 w-4 text-sky-600" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
