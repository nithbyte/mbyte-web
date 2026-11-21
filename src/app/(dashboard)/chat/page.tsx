"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Plus,
  Phone,
  Video,
  Send,
  Paperclip,
  Image as ImageIcon,
  Check,
  CheckCheck,
  MoreVertical,
  Users,
  User,
  ArrowLeft,
  X,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  FileText,
  Download,
  Megaphone,
  Building2,
  Globe,
} from "lucide-react";
import { chatService } from "@/services/chatService";
import { apiClient } from "@/lib/api-client";
import {
  Conversation,
  ChatMessage,
  ColleagueContact,
  ChatMessageType,
} from "@/types/chat";
import { useCurrentUser, useOrganizations } from "@/hooks";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { useWebRTCCall } from "@/features/chat/useWebRTCCall";
import { CallOverlay } from "@/features/chat/CallOverlay";

export default function ChatPage() {
  const router = useRouter();
  const { data: currentUserQuery } = useCurrentUser();
  const authStoreUser = useAuthStore((s) => s.user);
  const currentUser = currentUserQuery || authStoreUser;
  const currentUserId = currentUser?.id || "curr_user";
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" ||
    (Array.isArray((currentUser as any)?.roles) && (currentUser as any).roles.includes("SUPER_ADMIN"));
  const isCompanyAdmin =
    currentUser?.role === "COMPANY_ADMIN" ||
    (Array.isArray((currentUser as any)?.roles) && (currentUser as any).roles.includes("COMPANY_ADMIN"));
  const canPostAnnouncement = isSuperAdmin || isCompanyAdmin;

  const { data: organizationsList } = useOrganizations(undefined, { enabled: isSuperAdmin });
  const [selectedTenantOrgId, setSelectedTenantOrgId] = useState<string>("all");

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<"NORMAL" | "HIGH" | "URGENT" | "POLICY">("NORMAL");
  const [announcementTargetOrgId, setAnnouncementTargetOrgId] = useState<string>("all");
  const [announcementNotify, setAnnouncementNotify] = useState<boolean>(true);
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<ColleagueContact[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "DIRECT" | "GROUP" | "CONTACTS">("ALL");
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebRTC Calling Hook
  const callState = useWebRTCCall(currentUserId);

  const closeChatPanel = useCallback(() => {
    const prevRoute =
      typeof window !== "undefined"
        ? sessionStorage.getItem("mbyte_prev_non_chat_route")
        : null;
    const fallback = currentUser?.role === "SUPER_ADMIN" ? "/companies" : "/";
    const target = prevRoute && !prevRoute.startsWith("/chat") ? prevRoute : fallback;
    router.push(target);
  }, [currentUser?.role, router]);

  // Close chat when clicking outside the chat panel (on outer backdrop) or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isNewChatModalOpen || callState.activeCall) return;
      const target = event.target as HTMLElement | null;
      if (!target || !chatContainerRef.current) return;
      if (chatContainerRef.current.contains(target)) return;
      // Ignore clicks on header/sidebar controls (they handle their own actions / chat toggle)
      if (target.closest("header") || target.closest("aside") || target.closest("[role='dialog']")) {
        return;
      }
      closeChatPanel();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isNewChatModalOpen) {
        setIsNewChatModalOpen(false);
        setIsGroupMode(false);
        return;
      }
      if (!callState.activeCall) {
        closeChatPanel();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [callState.activeCall, closeChatPanel, isNewChatModalOpen]);

  // Load initial conversations and contacts, and keep recent chats in sync
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [convList, contactList] = await Promise.all([
          chatService.getConversations(undefined, selectedTenantOrgId),
          chatService.getContacts(undefined, selectedTenantOrgId),
        ]);
        if (isMounted) {
          setConversations(convList);
          setContacts(contactList);

          if (convList.length > 0) {
            setSelectedConversationId((prev) =>
              convList.some((c) => c.id === prev) ? prev : convList[0].id
            );
          } else {
            setSelectedConversationId(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat data", err);
      }
    }

    loadData();

    // Periodic sync of conversations list for real-time recent chats updates
    const convTimer = setInterval(async () => {
      try {
        const freshConvs = await chatService.getConversations(
          searchQuery || undefined,
          selectedTenantOrgId
        );
        if (isMounted && Array.isArray(freshConvs)) {
          setConversations(freshConvs);
        }
      } catch {}
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(convTimer);
    };
  }, [selectedTenantOrgId]);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConversationId) return;

    let isMounted = true;
    async function loadMessages() {
      try {
        const currentConv = conversations.find((c) => c.id === selectedConversationId);
        const targetOrg =
          currentConv?.organizationId ||
          (selectedTenantOrgId !== "all" ? selectedTenantOrgId : undefined);

        const msgs = await chatService.getMessages(
          selectedConversationId!,
          1,
          50,
          targetOrg
        );
        if (isMounted) {
          setMessages(msgs);
          await chatService.markAsRead(selectedConversationId!, targetOrg);
          // Update local unread status and last message text if new message received
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            setConversations((prev) => {
              const target = prev.find((c) => c.id === selectedConversationId);
              if (!target) return prev;
              const hasChanged =
                target.hasUnread ||
                target.lastMessageText !== last.content ||
                target.lastMessageAt !== last.createdAt;
              if (!hasChanged) return prev;

              const updated: Conversation = {
                ...target,
                hasUnread: false,
                lastMessageText: last.content,
                lastMessageAt: last.createdAt,
                lastMessageSender: last.sender?.firstName || "Colleague",
              };
              return [updated, ...prev.filter((c) => c.id !== selectedConversationId)];
            });
          } else {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedConversationId ? { ...c, hasUnread: false } : c
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Polling for new incoming messages

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedConversationId, selectedTenantOrgId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  // Filter conversations with strict chronological sorting
  const filteredConversations = useMemo(() => {
    const list = conversations.filter((conv) => {
      const matchSearch =
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.lastMessageText &&
          conv.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;
      if (filterTab === "DIRECT") return conv.type === "DIRECT";
      if (filterTab === "GROUP") return conv.type === "GROUP";
      return true;
    });

    return list.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [conversations, searchQuery, filterTab]);

  // Filter contacts for main panel "Colleagues" tab
  const filteredDirectoryContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.firstName && c.firstName.toLowerCase().includes(q)) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.roleLabel && c.roleLabel.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.headquarters && c.headquarters.toLowerCase().includes(q)) ||
        (c.designation && c.designation.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  // Filter contacts in New Chat modal
  const modalFilteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) return contacts;
    const q = contactSearchQuery.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.firstName && c.firstName.toLowerCase().includes(q)) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.roleLabel && c.roleLabel.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.headquarters && c.headquarters.toLowerCase().includes(q)) ||
        (c.designation && c.designation.toLowerCase().includes(q))
    );
  }, [contacts, contactSearchQuery]);

  // Send text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConversationId || isSubmitting) return;

    const content = inputText.trim();
    setInputText("");
    setIsSubmitting(true);

    try {
      const currentConv = conversations.find((c) => c.id === selectedConversationId);
      const targetOrg =
        currentConv?.organizationId ||
        (selectedTenantOrgId !== "all" ? selectedTenantOrgId : undefined);

      const newMsg = await chatService.sendMessage(
        selectedConversationId,
        {
          content,
          messageType: "TEXT",
        },
        targetOrg
      );

      setMessages((prev) => [...prev, newMsg]);

      // Move active conversation immediately to top of recent chats list
      setConversations((prev) => {
        const target = prev.find((c) => c.id === selectedConversationId);
        if (!target) return prev;
        const updated: Conversation = {
          ...target,
          lastMessageText: content,
          lastMessageAt: new Date().toISOString(),
          lastMessageSender: "You",
          hasUnread: false,
        };
        return [updated, ...prev.filter((c) => c.id !== selectedConversationId)];
      });
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle File / Image Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversationId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const isImage = file.type.startsWith("image/");
      const msgType: ChatMessageType = isImage ? "IMAGE" : "FILE";

      let uploadedUrl: string | null = null;
      try {
        const uploadRes: any = await apiClient.post("/files/upload?folder=chat", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });
        const uploadData = uploadRes?.data || uploadRes;
        uploadedUrl = uploadData?.secureUrl || uploadData?.fileUrl || uploadData?.url || null;
      } catch (uploadErr) {
        console.warn("Direct Cloudinary chat upload failed, falling back to data URI:", uploadErr);
      }

      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }

      const currentConv = conversations.find((c) => c.id === selectedConversationId);
      const targetOrg =
        currentConv?.organizationId ||
        (selectedTenantOrgId !== "all" ? selectedTenantOrgId : undefined);

      const newMsg = await chatService.sendMessage(
        selectedConversationId,
        {
          content: isImage ? "Shared an image" : `Shared document: ${file.name}`,
          messageType: msgType,
          fileUrl: uploadedUrl,
          fileName: file.name,
          fileSize: file.size,
        },
        targetOrg
      );

      setMessages((prev) => [...prev, newMsg]);
      setConversations((prev) => {
        const target = prev.find((c) => c.id === selectedConversationId);
        if (!target) return prev;
        const updated: Conversation = {
          ...target,
          lastMessageText: isImage ? "📷 Image" : `📎 ${file.name}`,
          lastMessageAt: new Date().toISOString(),
          lastMessageSender: "You",
          hasUnread: false,
        };
        return [updated, ...prev.filter((c) => c.id !== selectedConversationId)];
      });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Call colleague directly from roster or modal
  const handleCallColleague = async (colleague: ColleagueContact, type: "AUDIO" | "VIDEO") => {
    setIsNewChatModalOpen(false);
    try {
      const conv = await chatService.createConversation(
        {
          type: "DIRECT",
          recipientId: colleague.id,
          participantIds: [colleague.id],
        },
        colleague.organizationId || (selectedTenantOrgId !== "all" ? selectedTenantOrgId : undefined)
      );
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setSelectedConversationId(conv.id);
      callState.startCall(conv.id, colleague.id, colleague.name, type);
    } catch (err) {
      console.error("Failed to call colleague", err);
    }
  };

  // Start Call from conversation header
  const handleInitiateCall = (type: "AUDIO" | "VIDEO") => {
    if (!activeConversation) return;
    const partner = activeConversation.participants?.find(
      (p: any) => (p.userId || p.user?.id) !== currentUserId
    );
    const receiverId = partner?.userId || (partner as any)?.user?.id;
    const receiverName =
      partner?.name ||
      ((partner as any)?.user
        ? `${(partner as any).user.firstName} ${(partner as any).user.lastName}`.trim()
        : null) ||
      activeConversation.title;

    callState.startCall(activeConversation.id, receiverId, receiverName, type);
  };

  // Create Conversation
  const handleCreateConversation = async (participantId: string) => {
    try {
      const matchedContact = contacts.find((c) => c.id === participantId);
      const targetOrg =
        matchedContact?.organizationId ||
        (selectedTenantOrgId !== "all" ? selectedTenantOrgId : undefined);

      const conv = await chatService.createConversation(
        {
          type: "DIRECT",
          recipientId: participantId,
          participantIds: [participantId],
        },
        targetOrg
      );
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setSelectedConversationId(conv.id);
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error("Failed to start direct conversation", err);
    }
  };

  // Create Group
  const handleCreateGroup = async () => {
    if (!groupTitle.trim() || selectedContactIds.length === 0) return;
    try {
      const conv = await chatService.createConversation(
        {
          type: "GROUP",
          title: groupTitle.trim(),
          participantIds: selectedContactIds,
        },
        selectedTenantOrgId !== "all" ? selectedTenantOrgId : undefined
      );
      setConversations((prev) => [conv, ...prev]);
      setSelectedConversationId(conv.id);
      setIsNewChatModalOpen(false);
      setGroupTitle("");
      setSelectedContactIds([]);
      setIsGroupMode(false);
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  // Post Announcement
  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    setIsPostingAnnouncement(true);
    try {
      await chatService.postAnnouncement({
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        priority: announcementPriority,
        organizationId: isSuperAdmin ? announcementTargetOrgId : undefined,
        sendNotification: announcementNotify,
      });
      setIsAnnouncementModalOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementPriority("NORMAL");
      // Refetch conversations immediately
      const updatedConvs = await chatService.getConversations(
        searchQuery || undefined,
        selectedTenantOrgId
      );
      setConversations(updatedConvs);
      if (updatedConvs.length > 0) {
        setSelectedConversationId(updatedConvs[0].id);
      }
    } catch (err: any) {
      alert("Failed to post announcement: " + (err?.response?.data?.message || err?.message));
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenNewChatModal = async () => {
    setIsNewChatModalOpen(true);
    setContactSearchQuery("");
    try {
      const fresh = await chatService.getContacts(undefined, selectedTenantOrgId);
      if (Array.isArray(fresh) && fresh.length > 0) {
        setContacts(fresh);
      }
    } catch {
      // Keep existing contacts
    }
  };

  return (
    <div
      ref={chatContainerRef}
      className="flex h-[calc(100vh-5.5rem)] overflow-hidden rounded-3xl border border-[#E5E1D9] bg-white shadow-xl dark:border-[#333333] dark:bg-[#1E1E1E]"
    >
      {/* Global Call Overlay (Mounts Audio/Video Call View) */}
      <CallOverlay
        activeCall={callState.activeCall}
        callDuration={callState.callDuration}
        isMuted={callState.isMuted}
        isVideoEnabled={callState.isVideoEnabled}
        isScreenSharing={callState.isScreenSharing}
        localStream={callState.localStream}
        remoteStream={callState.remoteStream}
        currentUserId={currentUserId}
        hasRealMic={callState.hasRealMic}
        micError={callState.micError}
        micLevel={callState.micLevel}
        audioInputDevices={callState.audioInputDevices}
        selectedAudioDeviceId={callState.selectedAudioDeviceId}
        onAccept={callState.acceptCall}
        onReject={callState.rejectCall}
        onEndCall={callState.endCall}
        onToggleMute={callState.toggleMute}
        onToggleVideo={callState.toggleVideo}
        onToggleScreenShare={callState.toggleScreenShare}
        onSwitchMicrophone={callState.switchMicrophone}
      />

      {/* LEFT PANEL: Conversation Directory */}
      <div
        className={cn(
          "flex flex-col border-r border-[#E5E1D9] dark:border-[#333333] w-full md:w-80 lg:w-96 shrink-0 bg-slate-50/50 dark:bg-[#232323]/50",
          selectedConversationId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header & New Chat button */}
        <div className="p-4 pb-3 border-b border-[#E5E1D9] dark:border-[#333333]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-[#FF6B00]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Team Messages
                </h1>
                {isSuperAdmin && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                    Platform Control
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {canPostAnnouncement && (
                <button
                  onClick={() => {
                    setAnnouncementTargetOrgId(selectedTenantOrgId === "all" ? "all" : selectedTenantOrgId);
                    setIsAnnouncementModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Broadcast System or Company Announcement"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Announce</span>
                </button>
              )}
              <button
                onClick={handleOpenNewChatModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Super Admin Tenant Scope Selector */}
          {isSuperAdmin && (
            <div className="mb-2.5 p-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Tenant Scope
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedTenantOrgId === "all" ? "All active tenants" : "Single tenant"}
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedTenantOrgId}
                  onChange={(e) => setSelectedTenantOrgId(e.target.value)}
                  className="w-full pl-2.5 pr-8 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E1E] border border-orange-200 dark:border-orange-900/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF6B00] cursor-pointer"
                >
                  <option value="all">🌐 All Tenants (Global Supervision)</option>
                  {(organizationsList || []).map((org) => (
                    <option key={org.id} value={org.id}>
                      🏢 {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E1E1E] border border-[#E5E1D9] dark:border-[#333333] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
            {(["ALL", "DIRECT", "GROUP", "CONTACTS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
                  filterTab === tab
                    ? "bg-[#FF6B00] text-white font-semibold"
                    : "bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                {tab === "ALL" ? "All" : tab === "DIRECT" ? "Direct" : tab === "GROUP" ? "Groups" : "Colleagues (" + contacts.length + ")"}
              </button>
            ))}
          </div>
        </div>

        {/* Directory or Conversation List */}
        {filterTab === "CONTACTS" ? (
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E1D9]/40 dark:divide-[#333333]/40">
            {filteredDirectoryContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {searchQuery.trim()
                  ? `No colleagues matching "${searchQuery.trim()}".`
                  : "No team colleagues found."}
              </div>
            ) : (
              filteredDirectoryContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-100/70 dark:hover:bg-[#2a2a2a] transition-colors gap-2"
                >
                  <div
                    onClick={() => handleCreateConversation(c.id)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shadow-xs">
                        {((c.name || c.firstName || "C").trim().slice(0, 2)).toUpperCase()}
                      </div>
                      {c.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1E1E]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.roleLabel} • {c.headquarters || "Field"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCallColleague(c, "AUDIO")}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer transition-colors"
                      title={"Call " + c.name}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCallColleague(c, "VIDEO")}
                      className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] dark:bg-orange-950/40 cursor-pointer transition-colors"
                      title={"Video Call " + c.name}
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E1D9]/40 dark:divide-[#333333]/40">
            {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No conversations found. Click &quot;New&quot; to connect with a colleague.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              const isGroup = conv.type === "GROUP";
              const isAnnouncement =
                conv.title.includes("📢") ||
                conv.title.toLowerCase().includes("announcement");

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 transition-colors cursor-pointer relative rounded-lg mx-1.5 my-0.5 border",
                    isSelected
                      ? "bg-orange-50/80 dark:bg-[#FF6B00]/10 border-orange-200/90"
                      : "hover:bg-slate-100/70 dark:hover:bg-[#2a2a2a] border-transparent"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs",
                        isAnnouncement
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : isGroup
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      )}
                    >
                      {isAnnouncement ? (
                        <Megaphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      ) : isGroup ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        (conv.title || "C").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1E1E]" />
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {conv.title}
                        </h3>
                        {conv.organizationName && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium shrink-0">
                            {conv.organizationName}
                          </span>
                        )}
                      </div>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {conv.lastMessageText || "Start the conversation..."}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {conv.hasUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
        )}
      </div>

      {/* RIGHT MAIN PANEL: Active Conversation & Messages */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#1E1E1E]">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E5E1D9] dark:border-[#333333] flex items-center justify-between bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center font-bold text-sm shadow-xs">
                  {activeConversation.title.includes("📢") ||
                  activeConversation.title.toLowerCase().includes("announcement") ? (
                    <Megaphone className="w-5 h-5 text-amber-600" />
                  ) : activeConversation.type === "GROUP" ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    activeConversation.title.slice(0, 2).toUpperCase()
                  )}
                </div>
                {activeConversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1E1E]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {activeConversation.title}
                  </h2>
                  {activeConversation.organizationName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00] dark:bg-orange-950/40 font-semibold shrink-0">
                      🏢 {activeConversation.organizationName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeConversation.subtitle ||
                    (activeConversation.isOnline ? "Active now" : "Offline")}
                </p>
              </div>
            </div>

            {/* Calling Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleInitiateCall("AUDIO")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Voice Call</span>
              </button>

              <button
                onClick={() => handleInitiateCall("VIDEO")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#FF6B00]/10 hover:text-[#FF6B00] text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-[#FF6B00]/20 dark:hover:text-[#FF6B00] text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Start Video Call"
              >
                <Video className="w-4 h-4 text-[#FF6B00]" />
                <span className="hidden sm:inline">Video Call</span>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-[#FAF9F6] dark:bg-[#181818]">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const isCallLog = msg.messageType === "CALL_LOG";

              if (isCallLog) {
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300/40 dark:border-slate-700/60 shadow-2xs">
                      <span>{msg.content}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                >
                  {/* Sender Name in Group */}
                  {!isMe && activeConversation.type === "GROUP" && (
                    <span className="text-[10px] font-semibold text-slate-500 mb-1 ml-1">
                      {msg.sender?.firstName || "Member"}
                    </span>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-xs text-xs",
                      isMe
                        ? "bg-[#FF6B00] text-white rounded-br-xs"
                        : "bg-white dark:bg-[#272727] text-slate-900 dark:text-slate-100 border border-[#E5E1D9] dark:border-[#333333] rounded-bl-xs"
                    )}
                  >
                    {/* Image Attachment */}
                    {msg.messageType === "IMAGE" && msg.fileUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden max-h-60 bg-black/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.fileUrl}
                          alt="Attachment"
                          className="w-full h-auto object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {/* File Attachment */}
                    {msg.messageType === "FILE" && msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        download={msg.fileName || "download"}
                        className={cn(
                          "flex items-center gap-2.5 p-2 rounded-xl mb-2 transition-colors",
                          isMe
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        )}
                      >
                        <FileText className="w-5 h-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-[11px]">
                            {msg.fileName || "Document"}
                          </p>
                          {msg.fileSize && (
                            <p className="text-[10px] opacity-75">
                              {(msg.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        <Download className="w-4 h-4 shrink-0" />
                      </a>
                    )}

                    {/* Text Message */}
                    <p className="leading-relaxed whitespace-pre-wrap select-text">
                      {msg.content}
                    </p>

                    {/* Time & Read Receipts */}
                    <div
                      className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[10px]",
                        isMe ? "text-orange-100" : "text-slate-400"
                      )}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#1E1E1E] border-t border-[#E5E1D9] dark:border-[#333333]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx"
                onChange={handleFileUpload}
              />

              {/* Upload Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 rounded-xl text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                title="Attach Document or Image"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={
                  isUploading ? "Uploading file..." : "Type your message here..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isUploading}
                className="flex-1 py-2.5 px-4 text-xs rounded-xl bg-slate-100 dark:bg-[#272727] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] border-transparent"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className={cn(
                  "p-2.5 rounded-xl transition-all shadow-xs cursor-pointer",
                  inputText.trim() && !isSubmitting
                    ? "bg-[#FF6B00] hover:bg-[#e66000] text-white active:scale-95"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-[#181818]">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center mb-4 shadow-sm">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Conversation Selected
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
            Choose a colleague from the left menu or start a new conversation to coordinate field visits, orders, and clinical queries.
          </p>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>
      )}

      {/* NEW CHAT / START CONVERSATION MODAL */}
      {isNewChatModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsNewChatModalOpen(false);
            setIsGroupMode(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1E1E] border border-[#E5E1D9] dark:border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E1D9] dark:border-[#333333] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {isGroupMode ? "Create New Group Chat" : "Direct Message Colleague"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isGroupMode
                    ? "Select multiple colleagues for territory group coordination"
                    : "Reach out to MRs, Managers, and Corporate staff"}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setIsGroupMode(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-6 pt-3 flex items-center gap-3">
              <button
                onClick={() => setIsGroupMode(false)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer",
                  !isGroupMode
                    ? "bg-[#FF6B00] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                1-on-1 Chat
              </button>
              <button
                onClick={() => setIsGroupMode(true)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer",
                  isGroupMode
                    ? "bg-[#FF6B00] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                Create Group
              </button>
            </div>

            {/* If Group Mode: Group Name Input */}
            {isGroupMode && (
              <div className="px-6 pt-3">
                <input
                  type="text"
                  placeholder="Group Name (e.g. Mumbai Field Force Team)"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            )}

            {/* Search Colleague Contacts */}
            <div className="px-6 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, role or territory..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto px-6 divide-y divide-[#E5E1D9]/50 dark:divide-[#333333]/50">
              {modalFilteredContacts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {contactSearchQuery.trim()
                    ? `No colleagues matching "${contactSearchQuery.trim()}". Check the name, role, or territory.`
                    : "No colleagues found in the directory."}
                </div>
              ) : (
                modalFilteredContacts.map((c) => {
                  const isSelected = selectedContactIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (isGroupMode) {
                          toggleSelectContact(c.id);
                        } else {
                          handleCreateConversation(c.id);
                        }
                      }}
                      className={cn(
                        "py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors px-2 rounded-xl",
                        isSelected
                          ? "bg-orange-50/80 dark:bg-orange-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shadow-xs">
                            {((c.name || c.firstName || "C").trim().slice(0, 2)).toUpperCase()}
                          </div>
                          {c.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1E1E]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {c.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {c.roleLabel} • {c.headquarters || "Field"}
                          </p>
                        </div>
                      </div>

                    {isGroupMode ? (
                      <div
                        className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                            : "border-slate-300 dark:border-slate-600"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallColleague(c, "AUDIO");
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallColleague(c, "VIDEO");
                          }}
                          className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6B00] transition-colors"
                          title="Video Call"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-[#FF6B00] font-semibold hover:underline ml-1">
                          Message &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

            {/* Group Submit Footer */}
            {isGroupMode && (
              <div className="p-4 bg-slate-50 dark:bg-[#252525] border-t border-[#E5E1D9] dark:border-[#333333] flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {selectedContactIds.length} member(s) selected
                </span>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupTitle.trim() || selectedContactIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Create Group Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POST ANNOUNCEMENT MODAL */}
      {isAnnouncementModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAnnouncementModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1E1E] border border-[#E5E1D9] dark:border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E1D9] dark:border-[#333333] flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Broadcast Announcement
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSuperAdmin
                      ? "Publish company-wide policy, circular, or critical notice across tenants"
                      : "Publish company announcement to all team members"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Target Scope (if Super Admin) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Organization / Scope
                  </label>
                  <select
                    value={announcementTargetOrgId}
                    onChange={(e) => setAnnouncementTargetOrgId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="all">🌐 All Active Tenants (Global Broadcast)</option>
                    {(organizationsList || []).map((org) => (
                      <option key={org.id} value={org.id}>
                        🏢 {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Announcement Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Target Revision & Product Launch Policy"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Priority / Tag
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["NORMAL", "HIGH", "URGENT", "POLICY"] as const).map((pr) => (
                    <button
                      type="button"
                      key={pr}
                      onClick={() => setAnnouncementPriority(pr)}
                      className={cn(
                        "py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                        announcementPriority === pr
                          ? pr === "URGENT"
                            ? "bg-red-500 text-white border-red-500"
                            : pr === "POLICY"
                            ? "bg-purple-600 text-white border-purple-600"
                            : pr === "HIGH"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-[#FF6B00] text-white border-[#FF6B00]"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200"
                      )}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Announcement Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content / Details *
                </label>
                <textarea
                  rows={4}
                  placeholder="Type the full announcement message for field force and management..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#252525] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FF6B00] resize-none"
                />
              </div>

              {/* In-app Notification Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={announcementNotify}
                  onChange={(e) => setAnnouncementNotify(e.target.checked)}
                  className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Send immediate in-app push notification to active members
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#E5E1D9] dark:border-[#333333] bg-slate-50 dark:bg-[#1E1E1E] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostAnnouncement}
                disabled={!announcementTitle.trim() || !announcementContent.trim() || isPostingAnnouncement}
                className={cn(
                  "px-5 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5",
                  announcementTitle.trim() && announcementContent.trim() && !isPostingAnnouncement
                    ? "bg-amber-500 hover:bg-amber-600 active:scale-95"
                    : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-400"
                )}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>{isPostingAnnouncement ? "Broadcasting..." : "Broadcast Announcement"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

