"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Megaphone,
  Plus,
  Search,
  Bell,
  Trash2,
  Users,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Smartphone,
  Send,
  X,
  Filter,
  Building2,
  RefreshCw,
  Globe,
  Radio,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { chatService } from "@/services/chatService";
import { useCurrentUser, useOrganizations } from "@/hooks";
import { useAuthStore } from "@/store/useAuthStore";
import {
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementTargetRole,
  AnnouncementScope,
} from "@/types/chat";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function AnnouncementsContent() {
  const searchParams = useSearchParams();
  const initialOrgId = searchParams?.get("organizationId") || searchParams?.get("tenantId") || "all";

  const { data: currentUserQuery } = useCurrentUser();
  const authStoreUser = useAuthStore((s) => s.user);
  const user = currentUserQuery || authStoreUser;
  const userRole = String(user?.role || "");
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isCompanyAdmin =
    userRole === "COMPANY_ADMIN" ||
    userRole === "ADMIN" ||
    isSuperAdmin;

  // Organizations list for Super Admin tenant switcher
  const { data: organizationsList = [], isLoading: isLoadingOrgs } = useOrganizations(undefined, {
    enabled: isSuperAdmin,
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<"ALL" | "GLOBAL" | "TENANT">("ALL");

  // Selected Tenant for Super Admin
  const [selectedTenantOrgId, setSelectedTenantOrgId] = useState<string>(
    isSuperAdmin ? initialOrgId : (user as any)?.organizationId || "all"
  );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [formScope, setFormScope] = useState<AnnouncementScope>(
    isSuperAdmin && selectedTenantOrgId === "all" ? "GLOBAL" : "TENANT"
  );
  const [formTargetOrgId, setFormTargetOrgId] = useState<string>(
    selectedTenantOrgId !== "all" ? selectedTenantOrgId : "all"
  );
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>("NORMAL");
  const [formTargetRole, setFormTargetRole] = useState<AnnouncementTargetRole>("ALL");
  const [formSendPush, setFormSendPush] = useState(true);

  // Sync selectedTenantOrgId when initialOrgId changes via URL
  useEffect(() => {
    if (initialOrgId && initialOrgId !== "all" && isSuperAdmin) {
      setSelectedTenantOrgId(initialOrgId);
      setFormTargetOrgId(initialOrgId);
      setFormScope("TENANT");
    }
  }, [initialOrgId, isSuperAdmin]);

  // Find currently selected organization object
  const currentSelectedOrg = useMemo(() => {
    if (selectedTenantOrgId === "all") return null;
    return organizationsList.find((o) => o.id === selectedTenantOrgId) || null;
  }, [selectedTenantOrgId, organizationsList]);

  // Fetch announcements based on tenant and scope
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      let targetOrgId: string | undefined = undefined;

      if (isSuperAdmin) {
        if (selectedTenantOrgId !== "all") {
          targetOrgId = selectedTenantOrgId;
        }
      } else {
        targetOrgId = (user as any)?.organizationId;
      }

      const res = await chatService.getAnnouncements({
        search: searchQuery.trim() || undefined,
        limit: 100,
        organizationId: targetOrgId,
        scope: selectedScopeFilter !== "ALL" ? selectedScopeFilter : undefined,
      });

      const items = res?.items || (Array.isArray(res) ? res : []);
      setAnnouncements(items);
      setTotalCount(typeof res?.total === "number" ? res.total : items.length);
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [searchQuery, selectedTenantOrgId, selectedScopeFilter, user?.id, (user as any)?.organizationId]);

  // Open modal with clean defaults based on active view
  const handleOpenModal = () => {
    if (isSuperAdmin) {
      if (selectedTenantOrgId !== "all") {
        setFormScope("TENANT");
        setFormTargetOrgId(selectedTenantOrgId);
      } else {
        setFormScope("GLOBAL");
        setFormTargetOrgId("all");
      }
    } else {
      setFormScope("TENANT");
      setFormTargetOrgId((user as any)?.organizationId || "");
    }
    setIsModalOpen(true);
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setStatusMessage({ type: "error", text: "Please enter both title and announcement details." });
      return;
    }

    if (isSuperAdmin && formScope === "TENANT" && (!formTargetOrgId || formTargetOrgId === "all")) {
      setStatusMessage({
        type: "error",
        text: "Please select a target tenant organization for this tenant-specific announcement.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      let targetOrgId: string | undefined = undefined;

      if (isSuperAdmin) {
        if (formScope === "GLOBAL") {
          targetOrgId = "all";
        } else {
          targetOrgId = formTargetOrgId;
        }
      } else {
        targetOrgId = (user as any)?.organizationId;
      }

      const res = await chatService.postAnnouncement({
        title: formTitle.trim(),
        content: formContent.trim(),
        priority: formPriority,
        targetRole: formTargetRole,
        sendNotification: formSendPush,
        scope: formScope,
        organizationId: targetOrgId,
      });

      setStatusMessage({
        type: "success",
        text:
          formScope === "GLOBAL"
            ? "🌐 Overall App Announcement successfully broadcasted across all tenants!"
            : "🏢 Announcement successfully published to target organization!",
      });

      // Reset form
      setFormTitle("");
      setFormContent("");
      setFormPriority("NORMAL");
      setFormTargetRole("ALL");
      setFormSendPush(true);
      setIsModalOpen(false);

      // Refresh list
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Announcement post error:", err);
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Failed to broadcast announcement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (id: string, isOverallApp?: boolean) => {
    if (isOverallApp && !isSuperAdmin) {
      alert("Only Super Administrators can remove Overall App Announcements.");
      return;
    }

    const confirmMsg = isOverallApp
      ? "Are you sure you want to delete this Overall App Announcement? It will be removed across all tenant organizations."
      : "Are you sure you want to delete this announcement?";

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(id);
    try {
      await chatService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setStatusMessage({ type: "success", text: "Announcement successfully removed." });
    } catch (err: any) {
      console.error("Delete error:", err);
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Failed to delete announcement.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered announcements by priority
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      if (selectedPriority !== "ALL" && item.priority !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [announcements, selectedPriority]);

  // Stats calculation
  const urgentCount = useMemo(
    () => announcements.filter((a) => a.priority === "URGENT" || a.priority === "HIGH").length,
    [announcements]
  );
  const globalCount = useMemo(
    () => announcements.filter((a) => a.isOverallApp || a.scope === "GLOBAL").length,
    [announcements]
  );
  const tenantCount = useMemo(
    () => announcements.filter((a) => !a.isOverallApp && a.scope !== "GLOBAL").length,
    [announcements]
  );

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> HIGH
          </span>
        );
      case "POLICY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <FileText className="w-3.5 h-3.5" /> POLICY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> NORMAL
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Status Alert Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Super Admin Tenant Scope Switcher */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF6B00] text-white">
                  <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN PLATFORM CONTROL
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400">
                  Tenant-Isolated Announcements & Overall App Broadcasts
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentSelectedOrg
                  ? `🏢 Separate Announcement Channel: ${currentSelectedOrg.name} (${currentSelectedOrg.code})`
                  : "🌐 Overall Platform View: All Tenants & Global Broadcasts"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-gray-300 whitespace-nowrap flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" /> Select Tenant:
              </label>
              <select
                value={selectedTenantOrgId}
                onChange={(e) => {
                  setSelectedTenantOrgId(e.target.value);
                  setFormTargetOrgId(e.target.value);
                  if (e.target.value !== "all") {
                    setFormScope("TENANT");
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-gray-700 bg-white dark:bg-[#182030] text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="all">🌐 All Active Tenants (Global Broadcast Feed)</option>
                {organizationsList.map((org) => (
                  <option key={org.id} value={org.id}>
                    🏢 {org.name} ({org.code})
                  </option>
                ))}
              </select>

              {selectedTenantOrgId !== "all" && (
                <button
                  onClick={() => {
                    setSelectedTenantOrgId("all");
                    setFormScope("GLOBAL");
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-[#FF6B00] hover:text-[#e66000] hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B00]">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isSuperAdmin
                  ? currentSelectedOrg
                    ? `${currentSelectedOrg.name} Announcements`
                    : "Organization Announcements & Global Broadcasts"
                  : `${(user as any)?.organizationName || "Company"} Announcements`}
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {isSuperAdmin
                  ? currentSelectedOrg
                    ? `Separate announcement circulars and notices isolated strictly for ${currentSelectedOrg.name}`
                    : "Broadcast overall app announcements across all tenants, or publish to a dedicated tenant organization"
                  : "Broadcast official circulars, policy alerts, and field updates to your team"}
              </p>
            </div>
          </div>
        </div>

        {isCompanyAdmin && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#F45100] text-white font-medium shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isSuperAdmin
                ? selectedTenantOrgId === "all"
                  ? "Broadcast Overall App Announcement"
                  : `Post to ${currentSelectedOrg?.name || "Tenant"}`
                : "New Company Announcement"}
            </span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Announcements</span>
            <Megaphone className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</div>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
            {selectedTenantOrgId !== "all"
              ? "Notices in this tenant's channel"
              : "Active broadcasts across platform"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Overall App Broadcasts</span>
            <Globe className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{globalCount}</div>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Super Admin platform notices</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Tenant Circulars</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tenantCount}</div>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Tenant-specific isolated notices</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Priority Bulletins</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{urgentCount}</div>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Urgent or high-impact notices</p>
        </div>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setSelectedScopeFilter("ALL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedScopeFilter === "ALL"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
          }`}
        >
          <span>All Announcements</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/60 dark:bg-gray-700">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedScopeFilter("GLOBAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedScopeFilter === "GLOBAL"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>🌐 Overall App Announcements (Super Admin)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-200 dark:bg-violet-900/60 text-violet-900 dark:text-violet-200">
            {globalCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedScopeFilter("TENANT")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedScopeFilter === "TENANT"
              ? "bg-[#FF6B00] text-white shadow-xs"
              : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>🏢 Tenant-Specific Announcements</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200">
            {tenantCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#182030] border border-slate-200 dark:border-gray-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(["ALL", "URGENT", "HIGH", "POLICY", "NORMAL"] as const).map((pri) => (
            <button
              key={pri}
              onClick={() => setSelectedPriority(pri)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPriority === pri
                  ? "bg-[#FF6B00] text-white"
                  : "bg-slate-100 dark:bg-[#182030] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-gray-800"
              }`}
            >
              {pri === "ALL" ? "All Priorities" : pri}
            </button>
          ))}
          <button
            onClick={() => fetchAnnouncements()}
            title="Refresh"
            className="p-2 rounded-lg bg-slate-100 dark:bg-[#182030] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors ml-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading && announcements.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs">
            <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-gray-800/80 shadow-xs">
            <Megaphone className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              No Announcements Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? `No announcements match "${searchQuery}". Try a different keyword.`
                : selectedTenantOrgId !== "all"
                ? `No announcements have been published for ${currentSelectedOrg?.name || "this tenant"} yet.`
                : "No announcements have been broadcasted yet. Keep your field force aligned by sharing circulars."}
            </p>
            {isCompanyAdmin && (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B00] hover:bg-[#e66000] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isSuperAdmin
                    ? selectedTenantOrgId === "all"
                      ? "Broadcast Overall App Announcement"
                      : `Post to ${currentSelectedOrg?.name || "Tenant"}`
                    : "Create Company Announcement"}
                </span>
              </button>
            )}
          </div>
        ) : (
          filteredAnnouncements.map((item) => {
            const isGlobal = Boolean(item.isOverallApp || item.scope === "GLOBAL");

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-white dark:bg-[#111622] border transition-all shadow-xs ${
                  isGlobal
                    ? "border-violet-300/80 dark:border-violet-900/60 ring-1 ring-violet-500/10"
                    : "border-slate-200/80 dark:border-gray-800/80 hover:border-slate-300 dark:hover:border-gray-700"
                }`}
              >
                {/* Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scope Badge */}
                    {isGlobal ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                        <Globe className="w-3.5 h-3.5" /> 🌐 OVERALL APP ANNOUNCEMENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Building2 className="w-3.5 h-3.5" />{" "}
                        {item.organizationName ? `🏢 ${item.organizationName}` : "🏢 TENANT ANNOUNCEMENT"}
                      </span>
                    )}

                    {getPriorityBadge(item.priority)}

                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#182030] px-2 py-0.5 rounded-md text-slate-700 dark:text-gray-300 font-medium">
                      <Users className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>
                        {isGlobal ? "All Active Members" : `${item.recipientsCount} recipients`}
                      </span>
                    </div>

                    {/* Delete action: Super Admin can delete anything; Company Admin can delete only tenant announcements */}
                    {isCompanyAdmin && (
                      <>
                        {isGlobal && !isSuperAdmin ? (
                          <span
                            className="p-1 text-slate-400 cursor-not-allowed"
                            title="Only Super Admin can delete overall app announcements"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAnnouncement(item.id, isGlobal)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
                            title={isGlobal ? "Delete Overall App Broadcast across all tenants" : "Delete Announcement"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-line leading-relaxed mb-4 pl-0.5">
                  {item.body || item.rawContent}
                </div>

                {/* Author Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-gray-800/60 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full font-semibold flex items-center justify-center text-[10px] ${
                        isGlobal
                          ? "bg-violet-600/15 text-violet-600 dark:text-violet-400"
                          : "bg-orange-600/15 text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {item.sender?.name?.[0] || (isGlobal ? "S" : "A")}
                    </div>
                    <span>
                      Posted by{" "}
                      <span className="text-slate-800 dark:text-gray-300 font-semibold">
                        {item.sender?.name || (isGlobal ? "Super Administrator" : "Company Administrator")}
                      </span>
                      {isGlobal && (
                        <span className="ml-1 text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                          (Platform Super Admin)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isGlobal
                        ? "Dispatched to All Tenants via Push & App Feed"
                        : "Delivered to Tenant via Mobile Push & In-App Feed"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isSuperAdmin
            ? formScope === "GLOBAL"
              ? "🌐 Broadcast Overall App Announcement"
              : "🏢 Post Tenant Announcement"
            : "Broadcast Company Announcement"
        }
        description={
          isSuperAdmin
            ? formScope === "GLOBAL"
              ? "Publish a global broadcast across all active tenants and team members. Only Super Admin has permission to execute this."
              : "Publish circular exclusively to the selected tenant organization."
            : "Send real-time circular to field representatives and managers in your organization."
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          {/* Announcement Scope (SUPER ADMIN EXCLUSIVE) */}
          {isSuperAdmin ? (
            <div className="p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                Announcement Scope *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setFormScope("GLOBAL");
                    setFormTargetOrgId("all");
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formScope === "GLOBAL"
                      ? "bg-violet-600 text-white border-violet-500 shadow-xs"
                      : "bg-white dark:bg-[#182030] border-slate-200 dark:border-gray-700/60 text-slate-700 dark:text-gray-300 hover:border-violet-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                    <Globe className="w-3.5 h-3.5" /> Overall App Announcement
                  </div>
                  <div
                    className={`text-[11px] ${
                      formScope === "GLOBAL" ? "text-violet-100" : "text-slate-500 dark:text-gray-400"
                    }`}
                  >
                    Broadcast across ALL tenant organizations (Super Admin only)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormScope("TENANT");
                    if (selectedTenantOrgId !== "all") {
                      setFormTargetOrgId(selectedTenantOrgId);
                    } else if (organizationsList.length > 0) {
                      setFormTargetOrgId(organizationsList[0].id);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formScope === "TENANT"
                      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-xs"
                      : "bg-white dark:bg-[#182030] border-slate-200 dark:border-gray-700/60 text-slate-700 dark:text-gray-300 hover:border-orange-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                    <Building2 className="w-3.5 h-3.5" /> Specific Tenant Only
                  </div>
                  <div
                    className={`text-[11px] ${
                      formScope === "TENANT" ? "text-orange-100" : "text-slate-500 dark:text-gray-400"
                    }`}
                  >
                    Isolated to a single tenant company
                  </div>
                </button>
              </div>

              {/* If Single Tenant selected, pick tenant */}
              {formScope === "TENANT" && (
                <div className="pt-2 border-t border-orange-200/60 dark:border-orange-900/40">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    Select Target Tenant Organization *
                  </label>
                  <select
                    value={formTargetOrgId}
                    onChange={(e) => setFormTargetOrgId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#182030] border border-slate-200 dark:border-gray-700/60 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="">-- Choose Tenant Company --</option>
                    {organizationsList.map((org) => (
                      <option key={org.id} value={org.id}>
                        🏢 {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            // Company Admin fixed scope indicator
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#182030] border border-slate-200 dark:border-gray-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Target: {(user as any)?.organizationName || "Your Company"} (This Tenant Only)</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                  Circular is restricted strictly to members of your organization
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                TENANT SCOPE
              </span>
            </div>
          )}

          {/* Target Audience (Roles) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-400 mb-2">
              Target Audience Roles
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormTargetRole("ALL")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formTargetRole === "ALL"
                    ? "bg-orange-50 dark:bg-orange-600/15 border-[#FF6B00] text-orange-700 dark:text-orange-400 shadow-xs font-semibold"
                    : "bg-slate-50 dark:bg-[#182030] border-slate-200 dark:border-gray-700/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">All Members</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">MRs, Managers, Staff</div>
              </button>

              <button
                type="button"
                onClick={() => setFormTargetRole("MR")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formTargetRole === "MR"
                    ? "bg-orange-50 dark:bg-orange-600/15 border-[#FF6B00] text-orange-700 dark:text-orange-400 shadow-xs font-semibold"
                    : "bg-slate-50 dark:bg-[#182030] border-slate-200 dark:border-gray-700/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Field Reps (MRs)</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">Medical Representatives only</div>
              </button>

              <button
                type="button"
                onClick={() => setFormTargetRole("MANAGER")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formTargetRole === "MANAGER"
                    ? "bg-orange-50 dark:bg-orange-600/15 border-[#FF6B00] text-orange-700 dark:text-orange-400 shadow-xs font-semibold"
                    : "bg-slate-50 dark:bg-[#182030] border-slate-200 dark:border-gray-700/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Managers Only</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">Area & Regional Managers</div>
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-400 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "NORMAL", label: "Normal" },
                { key: "HIGH", label: "High" },
                { key: "URGENT", label: "Urgent" },
                { key: "POLICY", label: "Policy" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setFormPriority(p.key as AnnouncementPriority)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    formPriority === p.key
                      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-xs"
                      : "bg-slate-50 dark:bg-[#182030] border-slate-200 dark:border-gray-700/60 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-400 mb-1.5">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Target Revision & Product Launch Schedule"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#182030] border border-slate-200 dark:border-gray-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-400 mb-1.5">
              Announcement Details *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide complete guidelines, instructions, or meeting details..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#182030] border border-slate-200 dark:border-gray-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          {/* Push Notification Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#182030] border border-slate-200 dark:border-gray-700/60">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-sky-500" />
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Instant Push Notification</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">
                  Vibrates mobile devices with sound and banners via FCM
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formSendPush}
                onChange={(e) => setFormSendPush(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B00]"></div>
            </label>
          </div>

          {/* Mobile Preview Box */}
          {(formTitle || formContent) && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Live Field Representative Notification Preview</span>
              </div>
              <div className="bg-white dark:bg-[#1a2232] rounded-lg p-3 border border-slate-200 dark:border-gray-700/50 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-[#FF6B00] flex items-center justify-center text-[8px] text-white font-bold">
                    M
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">Mediqbyte</span>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400">• now</span>
                  {formScope === "GLOBAL" && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-violet-500 text-white">
                      OVERALL APP
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  📢 Announcement: {formTitle || "Announcement Title"}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                  {formContent || "Details will appear here..."}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {formScope === "GLOBAL" ? "Broadcast to Entire Platform" : "Broadcast to Tenant Organization"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading announcements...</p>
        </div>
      }
    >
      <AnnouncementsContent />
    </Suspense>
  );
}
