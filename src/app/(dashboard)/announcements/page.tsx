"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { chatService } from "@/services/chatService";
import { useCurrentUser } from "@/hooks";
import { useAuthStore } from "@/store/useAuthStore";
import {
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementTargetRole,
} from "@/types/chat";

export default function AnnouncementsPage() {
  const { data: currentUserQuery } = useCurrentUser();
  const authStoreUser = useAuthStore((s) => s.user);
  const user = currentUserQuery || authStoreUser;
  const userRole = String(user?.role || "");
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isCompanyAdmin =
    userRole === "COMPANY_ADMIN" ||
    userRole === "ADMIN" ||
    isSuperAdmin;

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>("NORMAL");
  const [formTargetRole, setFormTargetRole] = useState<AnnouncementTargetRole>("ALL");
  const [formSendPush, setFormSendPush] = useState(true);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await chatService.getAnnouncements({
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      setAnnouncements(res?.items || []);
      setTotalCount(res?.total || 0);
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [searchQuery]);

  // Handle Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setStatusMessage({ type: "error", text: "Please enter both title and announcement details." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await chatService.postAnnouncement({
        title: formTitle.trim(),
        content: formContent.trim(),
        priority: formPriority,
        targetRole: formTargetRole,
        sendNotification: formSendPush,
      });

      setStatusMessage({
        type: "success",
        text: "Announcement successfully broadcasted to your organization!",
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
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    setDeletingId(id);
    try {
      await chatService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setStatusMessage({ type: "success", text: "Announcement successfully removed." });
    } catch (err: any) {
      console.error("Delete error:", err);
      setStatusMessage({ type: "error", text: "Failed to delete announcement." });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered announcements
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
  const totalReach = useMemo(
    () => announcements.reduce((acc, curr) => Math.max(acc, curr.recipientsCount || 0), 0),
    [announcements]
  );

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> HIGH
          </span>
        );
      case "POLICY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <FileText className="w-3.5 h-3.5" /> POLICY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Megaphone className="w-3.5 h-3.5" /> NORMAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Organization Announcements
              </h1>
              <p className="text-sm text-gray-400">
                Broadcast official circulars, policy alerts, and field updates to all team members
              </p>
            </div>
          </div>
        </div>

        {isCompanyAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111622] border border-gray-800/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Broadcasts</span>
            <Megaphone className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <p className="text-xs text-gray-500 mt-1">Official circulars published</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111622] border border-gray-800/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Priority Bulletins</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{urgentCount}</div>
          <p className="text-xs text-gray-500 mt-1">Urgent or high-impact notices</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111622] border border-gray-800/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Max Field Reach</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalReach}</div>
          <p className="text-xs text-gray-500 mt-1">Active users in audience</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111622] border border-gray-800/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Push Gateway</span>
            <Bell className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-semibold text-white">FCM Active</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Instant mobile delivery enabled</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-gray-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#182030] border border-gray-700/60 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(["ALL", "URGENT", "HIGH", "POLICY", "NORMAL"] as const).map((pri) => (
            <button
              key={pri}
              onClick={() => setSelectedPriority(pri)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedPriority === pri
                  ? "bg-orange-600 text-white"
                  : "bg-[#182030] text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {pri === "ALL" ? "All Priorities" : pri}
            </button>
          ))}
          <button
            onClick={() => fetchAnnouncements()}
            title="Refresh"
            className="p-2 rounded-lg bg-[#182030] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading && announcements.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#111622] border border-gray-800/80">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#111622] border border-gray-800/80">
            <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Announcements Found</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? `No announcements match "${searchQuery}". Try a different keyword.`
                : "No announcements have been broadcasted yet. Keep your field force aligned by sharing company circulars."}
            </p>
            {isCompanyAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Announcement</span>
              </button>
            )}
          </div>
        ) : (
          filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#111622] border border-gray-800/80 hover:border-gray-700 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getPriorityBadge(item.priority)}
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#182030] px-2 py-0.5 rounded-md text-gray-300">
                    <Users className="w-3.5 h-3.5 text-orange-400" />
                    <span>{item.recipientsCount} recipients</span>
                  </div>

                  {isCompanyAdmin && (
                    <button
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Body Content */}
              <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed mb-4 pl-0.5">
                {item.body || item.rawContent}
              </div>

              {/* Author Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-800/60 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-600/20 text-orange-400 font-semibold flex items-center justify-center text-[10px]">
                    {item.sender?.name?.[0] || "A"}
                  </div>
                  <span>
                    Posted by{" "}
                    <span className="text-gray-300 font-medium">
                      {item.sender?.name || "Tenant Administrator"}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Delivered via Mobile Push & In-App Feed</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#111622] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#161c2a]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Broadcast Announcement</h2>
                  <p className="text-xs text-gray-400">
                    Send real-time circular to field representatives and managers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-5">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormTargetRole("ALL")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTargetRole === "ALL"
                        ? "bg-orange-600/15 border-orange-500 text-white shadow-sm"
                        : "bg-[#182030] border-gray-700/60 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold text-xs mb-0.5">All Members</div>
                    <div className="text-[11px] text-gray-400">MRs, Managers, Staff</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetRole("MR")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTargetRole === "MR"
                        ? "bg-orange-600/15 border-orange-500 text-white shadow-sm"
                        : "bg-[#182030] border-gray-700/60 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold text-xs mb-0.5">Field Reps (MRs)</div>
                    <div className="text-[11px] text-gray-400">Medical Representatives only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetRole("MANAGER")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTargetRole === "MANAGER"
                        ? "bg-orange-600/15 border-orange-500 text-white shadow-sm"
                        : "bg-[#182030] border-gray-700/60 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold text-xs mb-0.5">Managers Only</div>
                    <div className="text-[11px] text-gray-400">Area & Regional Managers</div>
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "NORMAL", label: "Normal", color: "sky" },
                    { key: "HIGH", label: "High", color: "amber" },
                    { key: "URGENT", label: "Urgent", color: "rose" },
                    { key: "POLICY", label: "Policy", color: "purple" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setFormPriority(p.key as AnnouncementPriority)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        formPriority === p.key
                          ? "bg-orange-600 text-white border-orange-500 shadow-sm"
                          : "bg-[#182030] border-gray-700/60 text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Target Revision & Product Launch Schedule"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#182030] border border-gray-700/60 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Announcement Details *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete guidelines, instructions, or meeting details..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#182030] border border-gray-700/60 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Push Notification Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#182030] border border-gray-700/60">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Instant Push Notification</div>
                    <div className="text-[11px] text-gray-400">
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
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Mobile Preview Box */}
              {(formTitle || formContent) && (
                <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                    <span>Live Field Representative Notification Preview</span>
                  </div>
                  <div className="bg-[#1a2232] rounded-lg p-3 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center text-[8px] text-white font-bold">
                        M
                      </div>
                      <span className="text-[11px] font-bold text-white">Mediqbyte</span>
                      <span className="text-[10px] text-gray-400">• now</span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      📢 Announcement: {formTitle || "Announcement Title"}
                    </div>
                    <div className="text-[11px] text-gray-300 line-clamp-2 mt-0.5">
                      {formContent || "Details will appear here..."}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-orange-600/20 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Broadcast to Organization</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
