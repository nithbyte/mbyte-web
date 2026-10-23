"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  MapPin,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  Info,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { AppNotification } from "@/services/notificationService";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  anchorRef,
}: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    // Close on Escape
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const displayList = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    return true;
  });

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await markReadMutation.mutateAsync(notif.id);
      } catch {
        // continue navigation
      }
    }
    onClose();

    // Contextual routing based on category or content
    const titleLower = (notif.title || "").toLowerCase();
    const msgLower = (notif.message || "").toLowerCase();
    const categoryLower = (notif.category || "").toLowerCase();

    if (
      categoryLower.includes("exception") ||
      titleLower.includes("exception") ||
      msgLower.includes("exception") ||
      titleLower.includes("outside radius")
    ) {
      router.push("/visits");
    } else if (categoryLower === "visit") {
      router.push("/visits");
    } else if (categoryLower === "order") {
      router.push("/orders");
    } else if (categoryLower === "collection") {
      router.push("/collections");
    } else if (categoryLower === "product") {
      router.push("/products");
    }
  };

  const getCategoryIcon = (category?: string, title?: string) => {
    const c = (category || "").toUpperCase();
    const t = (title || "").toLowerCase();

    if (c === "GEOFENCE_EXCEPTION" || t.includes("exception") || t.includes("radius")) {
      return (
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    }
    if (c === "VISIT") {
      return (
        <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 shrink-0">
          <Calendar className="h-4 w-4" />
        </div>
      );
    }
    if (c === "ORDER") {
      return (
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 shrink-0">
          <ShoppingCart className="h-4 w-4" />
        </div>
      );
    }
    if (c === "COLLECTION") {
      return (
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 shrink-0">
          <Receipt className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
        <Info className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-[#E5E1D9] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#202020] z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#E5E1D9] dark:border-[#333333] flex items-center justify-between bg-slate-50/60 dark:bg-[#1a1a1a]/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#FF6B00] dark:bg-orange-950/70">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="warning" className="ml-1.5 text-[9px] py-0 px-1.5 h-4 bg-orange-50 text-[#FF6B00] border-orange-200">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              className="h-6 text-[10px] px-2 text-[#FF6B00] hover:text-[#E05F00] hover:bg-orange-50 dark:hover:bg-orange-950/40"
              title="Mark all notifications as read"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <button
            onClick={onClose}
            aria-label="Close notification popover"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b border-slate-100 dark:border-[#2a2a2a] bg-white dark:bg-[#202020]">
        <button
          onClick={() => setFilter("ALL")}
          className={cn(
            "text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer",
            filter === "ALL"
              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={cn(
            "text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer",
            filter === "UNREAD"
              ? "bg-orange-50 text-[#FF6B00] dark:bg-orange-950/40 dark:text-orange-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2d2d2d]">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : displayList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {filter === "UNREAD" ? "No unread notifications" : "All caught up! No notifications."}
            </p>
          </div>
        ) : (
          displayList.map((n) => {
            const isUnread = !n.isRead;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-[#272727]",
                  isUnread && "bg-orange-50/40 dark:bg-orange-950/10"
                )}
              >
                {getCategoryIcon(n.category, n.title)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "text-xs font-bold leading-tight truncate",
                        isUnread
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {n.title}
                    </span>
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-[#FF6B00] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>{formatDate(n.createdAt)}</span>
                    <span className="flex items-center gap-0.5 text-[#FF6B00] hover:underline">
                      View details
                      <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#1a1a1a] text-center">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-300"
          onClick={() => {
            onClose();
            router.push("/visits");
          }}
        >
          View Field Telemetry & Exception Center →
        </Button>
      </div>
    </div>
  );
}
