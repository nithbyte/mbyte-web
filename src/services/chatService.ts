import { apiClient } from "@/lib/api-client";
import {
  Conversation,
  ChatMessage,
  CallSession,
  ColleagueContact,
  ChatMessageType,
  CallType,
  CallStatus,
  CreateAnnouncementInput,
  AnnouncementItem,
  AnnouncementsResponse,
} from "@/types/chat";

// Live directory cache
let liveContacts: ColleagueContact[] = [];
const directoryContactsMap = new Map<string, ColleagueContact>();

function mapMrToContact(mr: any): ColleagueContact {
  const user = mr.user || {};
  const firstName = (user.firstName || "").trim();
  const lastName = (user.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim() || user.email || "Colleague";
  const role = mr.designation?.toLowerCase().includes("manager") ? "MANAGER" : "MR";
  const designation = mr.designation || "Medical Representative";
  const headquarters = mr.headquarters || mr.territory?.name || "Field";

  return {
    id: mr.userId || user.id || mr.id,
    name: fullName,
    firstName: firstName || (user.email ? user.email.split("@")[0] : "Colleague"),
    lastName: lastName,
    email: user.email || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl,
    role,
    roleLabel: designation,
    headquarters,
    designation,
    isOnline: true,
  };
}

function mapUserToContact(user: any): ColleagueContact {
  const firstName = (user.firstName || "").trim();
  const lastName = (user.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim() || user.email || "Colleague";
  const primaryRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "MR";
  const roleLabel = primaryRole.replace(/_/g, " ");

  return {
    id: user.id,
    name: fullName,
    firstName: firstName || (user.email ? user.email.split("@")[0] : "Colleague"),
    lastName: lastName,
    email: user.email || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl,
    role: primaryRole,
    roleLabel: roleLabel,
    headquarters: user.headquarters || "Corporate HQ",
    designation: user.designation || roleLabel,
    isOnline: true,
  };
}

let mockConversations: Conversation[] = [];
let mockMessages: Record<string, ChatMessage[]> = {};

let activeMockCall: CallSession | null = null;
let mockCallSignals: Record<string, any[]> = {};
let chatEndpointsSupported: boolean | null = null;

export const chatService = {
  /**
   * Get all active conversations
   */
  async getConversations(search?: string, organizationId?: string): Promise<Conversation[]> {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (organizationId && organizationId !== "all") params.organizationId = organizationId;

      const res = await apiClient.get<any>("/chat/conversations", { params });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err: any) {
      console.warn("getConversations error:", err);
    }
    return [];
  },

  /**
   * Get messages for conversation
   */
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
    organizationId?: string,
  ): Promise<ChatMessage[]> {
    try {
      const params: any = { page, limit };
      if (organizationId && organizationId !== "all") params.organizationId = organizationId;

      const res = await apiClient.get<any>(`/chat/conversations/${conversationId}/messages`, {
        params,
      });
      const data = res?.data || res;
      if (Array.isArray(data?.items)) {
        return data.items;
      }
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn(`Real getMessages fallback for ${conversationId}:`, err);
    }
    return [];
  },

  /**
   * Send a chat message
   */
  async sendMessage(
    conversationId: string,
    payload: {
      content: string;
      messageType?: ChatMessageType;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      metadata?: any;
    },
    organizationId?: string,
  ): Promise<ChatMessage> {
    try {
      const params: any = {};
      if (organizationId && organizationId !== "all") params.organizationId = organizationId;

      const res = await apiClient.post<any>(
        `/chat/conversations/${conversationId}/messages`,
        payload,
        { params },
      );
      const data = res?.data || res;
      if (data && data.id) {
        return data;
      }
    } catch (err) {
      console.error(`sendMessage error for ${conversationId}:`, err);
      throw err;
    }

    throw new Error("Failed to send message");
  },

  /**
   * Create or fetch 1-on-1 or group conversation
   */
  async createConversation(
    payload: {
      type?: "DIRECT" | "GROUP";
      recipientId?: string;
      participantIds?: string[];
      title?: string;
      organizationId?: string;
    },
    organizationId?: string,
  ): Promise<Conversation> {
    const targetRecipientId =
      payload.recipientId ||
      (payload.type === "DIRECT" && payload.participantIds?.length === 1 ? payload.participantIds[0] : undefined) ||
      (payload.participantIds?.length === 1 && !payload.title ? payload.participantIds[0] : undefined);

    const isDirect = payload.type === "DIRECT" || Boolean(targetRecipientId && !payload.title);
    const effectiveOrgId = organizationId || payload.organizationId;

    const normalizedPayload = {
      type: isDirect ? "DIRECT" : "GROUP",
      recipientId: isDirect ? targetRecipientId : undefined,
      participantIds: isDirect
        ? (targetRecipientId ? [targetRecipientId] : payload.participantIds)
        : (payload.participantIds || []),
      title: isDirect ? undefined : (payload.title?.trim() || "Team Channel"),
      organizationId: effectiveOrgId && effectiveOrgId !== "all" ? effectiveOrgId : undefined,
    };

    const params: any = {};
    if (effectiveOrgId && effectiveOrgId !== "all") {
      params.organizationId = effectiveOrgId;
    }

    const res = await apiClient.post<any>("/chat/conversations", normalizedPayload, { params });
    const data = res?.data || res;
    if (data && data.id) {
      return data;
    }
    throw new Error("Failed to create conversation");
  },

  /**
   * Mark as read
   */
  async markAsRead(conversationId: string, organizationId?: string): Promise<void> {
    try {
      const params: any = {};
      if (organizationId && organizationId !== "all") params.organizationId = organizationId;
      await apiClient.post(`/chat/conversations/${conversationId}/read`, {}, { params });
    } catch {
      // ignore
    }
  },

  /**
   * Get enterprise contacts / team directory with live directory fallback
   */
  async getContacts(search?: string, organizationId?: string): Promise<ColleagueContact[]> {
    let rawContacts: ColleagueContact[] = [];
    let resolvedFromBackend = false;

    // 1. Dedicated chat contacts endpoint
    try {
      const params: any = {};
      if (search) params.search = search;
      if (organizationId && organizationId !== "all") params.organizationId = organizationId;

      const res = await apiClient.get<any>("/chat/contacts", { params });
      const data = Array.isArray(res) ? res : (res?.data || res?.items);
      if (Array.isArray(data)) {
        rawContacts = data;
        resolvedFromBackend = true;
      }
    } catch {
      // Fallback to enterprise personnel directory
    }

    // 2. Fetch live organization personnel directory (Users and MRs) if /chat/contacts is unavailable
    if (!resolvedFromBackend) {
      const contactsMap = new Map<string, ColleagueContact>();

      // Fetch users (available to Company Admin, Managers)
      try {
        const usersRes = await apiClient.get<any>("/users", {
          params: { limit: 100, search: search || undefined },
        });
        const usersList = Array.isArray(usersRes) ? usersRes : (usersRes?.data || usersRes?.items || []);
        if (Array.isArray(usersList)) {
          resolvedFromBackend = true;
          for (const u of usersList) {
            if (u && (u.id || u.email)) {
              const contact = mapUserToContact(u);
              contactsMap.set(contact.id, contact);
            }
          }
        }
      } catch {
        // Users endpoint restricted for non-admin roles
      }

      // Fetch MRs (available to all roles)
      try {
        const mrsRes = await apiClient.get<any>("/mrs", {
          params: { limit: 100, search: search || undefined },
        });
        const mrsList = Array.isArray(mrsRes) ? mrsRes : (mrsRes?.data || mrsRes?.items || []);
        if (Array.isArray(mrsList)) {
          resolvedFromBackend = true;
          for (const m of mrsList) {
            if (m && (m.userId || m.user?.id || m.id)) {
              const contact = mapMrToContact(m);
              contactsMap.set(contact.id, contact);
            }
          }
        }
      } catch {
        // Fallback
      }

      if (resolvedFromBackend) {
        rawContacts = Array.from(contactsMap.values());
      }
    }

    liveContacts = rawContacts;

    // Store in directoryContactsMap for conversation and call lookups
    for (const c of rawContacts) {
      directoryContactsMap.set(c.id, c);
      if (c.email) directoryContactsMap.set(c.email.toLowerCase(), c);
    }

    // Filter by search query if provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      return rawContacts.filter((c) => {
        return (
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
      });
    }

    return rawContacts;
  },

  /**
   * Post announcement to all tenants or a specific tenant
   */
  async postAnnouncement(payload: CreateAnnouncementInput): Promise<any> {
    const res = await apiClient.post<any>("/chat/announcements", payload);
    return res?.data || res;
  },

  /**
   * Get list of historical announcements
   */
  async getAnnouncements(params?: {
    search?: string;
    limit?: number;
    offset?: number;
    organizationId?: string;
  }): Promise<AnnouncementsResponse> {
    try {
      const res = await apiClient.get<any>("/chat/announcements", { params });
      const payload = res?.data?.items ? res.data : (res?.items ? res : (res?.data ?? res));
      if (payload && Array.isArray(payload.items)) {
        return payload;
      }
      if (Array.isArray(payload)) {
        return { items: payload, total: payload.length, limit: params?.limit || 50, offset: params?.offset || 0 };
      }
      return { items: [], total: 0, limit: 50, offset: 0 };
    } catch (err: any) {
      console.warn("getAnnouncements error:", err);
      return { items: [], total: 0, limit: 50, offset: 0 };
    }
  },

  /**
   * Delete or archive an announcement
   */
  async deleteAnnouncement(id: string): Promise<any> {
    const res = await apiClient.delete<any>(`/chat/announcements/${id}`);
    return res?.data || res;
  },

  // ==========================================
  // CALLING & WEBRTC SIGNALING
  // ==========================================

  /**
   * Initiate an audio or video call
   */
  async initiateCall(payload: {
    conversationId: string;
    receiverId?: string;
    callType: CallType;
    callerId?: string;
  }): Promise<any> {
    try {
      const res = await apiClient.post<any>("/chat/calls/initiate", payload);
      const data = res?.data || res;
      if (data && (data.id || data.callId)) {
        return {
          ...data,
          id: data.id || data.callId,
        };
      }
    } catch {
      // fallback
    }

    const contact =
      (payload.receiverId ? directoryContactsMap.get(payload.receiverId) : undefined) ||
      liveContacts.find((c) => c.id === payload.receiverId);
    const callerId = payload.callerId || "curr_user";
    activeMockCall = {
      id: `call_${Date.now()}`,
      conversationId: payload.conversationId,
      callerId,
      receiverId: payload.receiverId,
      callType: payload.callType,
      status: "CONNECTED",
      channelName: `channel_${Date.now()}`,
      durationSeconds: 0,
      startedAt: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
      caller: {
        id: callerId,
        firstName: "You",
        lastName: "",
        email: "admin@novispharma.com",
        avatarUrl: "",
      },
      receiver: {
        id: payload.receiverId || "usr_mgr_01",
        firstName: contact?.firstName || "Dr. Rajesh",
        lastName: contact?.lastName || "Sharma",
        email: contact?.email || "rajesh.sharma@novis.com",
        avatarUrl: contact?.avatarUrl || "",
      },
    };

    mockCallSignals[activeMockCall.id] = [];
    return activeMockCall;
  },

  /**
   * Check for active incoming or ongoing call
   */
  async getActiveCall(): Promise<CallSession | null> {
    if (chatEndpointsSupported !== false) {
      try {
        const res = await apiClient.get<any>("/chat/calls/active");
        chatEndpointsSupported = true;
        const data = res?.data || res;
        if (data && (data.id || data.callId)) {
          return {
            ...data,
            id: data.id || data.callId,
          };
        }
        return null;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.statusCode === 404 || err?.status === 404) {
          chatEndpointsSupported = false;
        }
      }
    }
    return activeMockCall;
  },

  /**
   * Fetch a specific call session by ID
   */
  async getCallSession(callId: string): Promise<CallSession | null> {
    try {
      const res = await apiClient.get<any>(`/chat/calls/${callId}`);
      const data = res?.data || res;
      if (data && (data.id || data.callId)) {
        return {
          ...data,
          id: data.id || data.callId,
        };
      }
    } catch {
      // fallback
    }
    return null;
  },

  /**
   * Respond to incoming call (ACCEPTED / REJECTED)
   */
  async respondToCall(callId: string, status: CallStatus): Promise<any> {
    try {
      const res = await apiClient.post<any>(`/chat/calls/${callId}/respond`, { status });
      return res?.data || res;
    } catch {
      // fallback
    }

    if (activeMockCall && activeMockCall.id === callId) {
      activeMockCall.status = status;
      if (status === "CONNECTED") {
        activeMockCall.connectedAt = new Date().toISOString();
      } else if (status === "REJECTED" || status === "MISSED") {
        activeMockCall.endedAt = new Date().toISOString();
      }
      return activeMockCall;
    }
  },

  /**
   * Send WebRTC Signal (SDP / ICE)
   */
  async sendSignal(callId: string, type: string, signalPayload: any): Promise<any> {
    try {
      const res = await apiClient.post<any>(`/chat/calls/${callId}/signal`, {
        type,
        payload: signalPayload,
      });
      return res?.data || res;
    } catch {
      // fallback
    }

    if (!mockCallSignals[callId]) {
      mockCallSignals[callId] = [];
    }
    mockCallSignals[callId].push({
      callSessionId: callId,
      senderId: "curr_user",
      type,
      payload: signalPayload,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Retrieve Signals from peer
   */
  async getSignals(callId: string, after?: string): Promise<any[]> {
    try {
      const res = await apiClient.get<any>(`/chat/calls/${callId}/signals`, {
        params: after ? { after } : undefined,
      });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    return mockCallSignals[callId] || [];
  },

  /**
   * End Call Session
   */
  async endCall(callId: string): Promise<any> {
    try {
      const res = await apiClient.post<any>(`/chat/calls/${callId}/end`);
      return res?.data || res;
    } catch {
      // fallback
    }

    if (activeMockCall && activeMockCall.id === callId) {
      activeMockCall.status = "ENDED";
      activeMockCall.endedAt = new Date().toISOString();
      const durationSeconds = activeMockCall.connectedAt
        ? Math.max(1, Math.round((Date.now() - new Date(activeMockCall.connectedAt).getTime()) / 1000))
        : 0;

      const mins = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      const formatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      const icon = activeMockCall.callType === "VIDEO" ? "📹" : "📞";
      const label = activeMockCall.callType === "VIDEO" ? "Video call" : "Audio call";

      // Log in conversation
      const convId = activeMockCall.conversationId;
      if (mockMessages[convId]) {
        mockMessages[convId].push({
          id: `msg_call_${Date.now()}`,
          conversationId: convId,
          senderId: "curr_user",
          content: `${icon} ${label} ended • ${formatted}`,
          messageType: "CALL_LOG",
          metadata: {
            callType: activeMockCall.callType,
            durationSeconds,
            durationFormatted: formatted,
          },
          createdAt: new Date().toISOString(),
          sender: {
            id: "curr_user",
            firstName: "You",
            lastName: "",
            email: "you@novis.com",
          },
        });
      }

      const finished = { ...activeMockCall, durationSeconds };
      activeMockCall = null;
      return finished;
    }
  },
};

