import { apiClient } from "@/lib/api-client";
import {
  Conversation,
  ChatMessage,
  CallSession,
  ColleagueContact,
  ChatMessageType,
  CallType,
  CallStatus,
} from "@/types/chat";

// Mock Fallback Data
let mockContacts: ColleagueContact[] = [
  {
    id: "usr_mgr_01",
    name: "Dr. Rajesh Sharma",
    firstName: "Rajesh",
    lastName: "Sharma",
    email: "rajesh.sharma@novispharma.com",
    phone: "+91 98765 43210",
    role: "MANAGER",
    roleLabel: "Area Sales Manager",
    headquarters: "Mumbai Central",
    designation: "Area Sales Manager",
    isOnline: true,
  },
  {
    id: "usr_mr_01",
    name: "Priya Patel",
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@novispharma.com",
    phone: "+91 98234 56789",
    role: "MR",
    roleLabel: "Medical Representative",
    headquarters: "Bandra West",
    designation: "Senior Field Executive",
    isOnline: true,
  },
  {
    id: "usr_mr_02",
    name: "Amit Kumar",
    firstName: "Amit",
    lastName: "Kumar",
    email: "amit.kumar@novispharma.com",
    phone: "+91 98123 45678",
    role: "MR",
    roleLabel: "Medical Representative",
    headquarters: "Andheri East",
    designation: "Territory Sales Executive",
    isOnline: false,
  },
  {
    id: "usr_admin_01",
    name: "Vikas Verma",
    firstName: "Vikas",
    lastName: "Verma",
    email: "vikas.verma@novispharma.com",
    phone: "+91 99001 12233",
    role: "COMPANY_ADMIN",
    roleLabel: "Commercial Director",
    headquarters: "Corporate HQ",
    designation: "Commercial Operations Head",
    isOnline: true,
  },
  {
    id: "usr_mr_03",
    name: "Sunita Deshmukh",
    firstName: "Sunita",
    lastName: "Deshmukh",
    email: "sunita.d@novispharma.com",
    phone: "+91 97654 32109",
    role: "MR",
    roleLabel: "Medical Representative",
    headquarters: "South Mumbai",
    designation: "Clinical Detailing Specialist",
    isOnline: true,
  },
];

let mockConversations: Conversation[] = [
  {
    id: "conv_01",
    organizationId: "org_novis",
    type: "DIRECT",
    title: "Dr. Rajesh Sharma",
    subtitle: "Area Sales Manager",
    avatarUrl: null,
    isOnline: true,
    lastMessageText: "Approved the DCR for today. Please check the Chemist stock for GlycoNov-M.",
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastMessageSender: "Dr. Rajesh Sharma",
    hasUnread: true,
    participantsCount: 2,
    participants: [
      { userId: "curr_user", name: "You", email: "you@novispharma.com", role: "MEMBER" },
      { userId: "usr_mgr_01", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@novispharma.com", role: "ADMIN", userRole: "MANAGER" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "conv_02",
    organizationId: "org_novis",
    type: "GROUP",
    title: "Cardio & Diabete Launch Team",
    subtitle: "4 members",
    avatarUrl: null,
    isOnline: false,
    lastMessageText: "📹 Video call ended • 14m 20s",
    lastMessageAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    lastMessageSender: "Priya Patel",
    hasUnread: false,
    participantsCount: 4,
    participants: [
      { userId: "curr_user", name: "You", email: "you@novispharma.com", role: "MEMBER" },
      { userId: "usr_mgr_01", name: "Dr. Rajesh Sharma", email: "rajesh.sharma@novispharma.com", role: "ADMIN", userRole: "MANAGER" },
      { userId: "usr_mr_01", name: "Priya Patel", email: "priya.patel@novispharma.com", role: "MEMBER", userRole: "MR" },
      { userId: "usr_mr_03", name: "Sunita Deshmukh", email: "sunita.d@novispharma.com", role: "MEMBER", userRole: "MR" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "conv_03",
    organizationId: "org_novis",
    type: "DIRECT",
    title: "Priya Patel",
    subtitle: "Medical Representative",
    avatarUrl: null,
    isOnline: true,
    lastMessageText: "Sent the visual aid slides to Dr. Shanmugam's clinic.",
    lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lastMessageSender: "Priya Patel",
    hasUnread: false,
    participantsCount: 2,
    participants: [
      { userId: "curr_user", name: "You", email: "you@novispharma.com", role: "MEMBER" },
      { userId: "usr_mr_01", name: "Priya Patel", email: "priya.patel@novispharma.com", role: "MEMBER", userRole: "MR" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockMessages: Record<string, ChatMessage[]> = {
  conv_01: [
    {
      id: "msg_101",
      conversationId: "conv_01",
      senderId: "curr_user",
      content: "Good morning Sir, I have planned 6 doctor visits and 3 pharmacy audits today in Bandra.",
      messageType: "TEXT",
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      sender: { id: "curr_user", firstName: "You", lastName: "", email: "you@novis.com" },
    },
    {
      id: "msg_102",
      conversationId: "conv_01",
      senderId: "usr_mgr_01",
      content: "Great. Make sure to detail the new GlycoNov-M visual aid deck to Dr. Kulkarni.",
      messageType: "TEXT",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      sender: { id: "usr_mgr_01", firstName: "Dr. Rajesh", lastName: "Sharma", email: "rajesh.sharma@novis.com" },
    },
    {
      id: "msg_103",
      conversationId: "conv_01",
      senderId: "curr_user",
      content: "Sure Sir, I will present the new clinical trial efficacy slides.",
      messageType: "TEXT",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      sender: { id: "curr_user", firstName: "You", lastName: "", email: "you@novis.com" },
    },
    {
      id: "msg_104",
      conversationId: "conv_01",
      senderId: "usr_mgr_01",
      content: "📞 Audio call ended • 3m 42s",
      messageType: "CALL_LOG",
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      metadata: { callType: "AUDIO", durationSeconds: 222 },
      sender: { id: "usr_mgr_01", firstName: "Dr. Rajesh", lastName: "Sharma", email: "rajesh.sharma@novis.com" },
    },
    {
      id: "msg_105",
      conversationId: "conv_01",
      senderId: "usr_mgr_01",
      content: "Approved the DCR for today. Please check the Chemist stock for GlycoNov-M.",
      messageType: "TEXT",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sender: { id: "usr_mgr_01", firstName: "Dr. Rajesh", lastName: "Sharma", email: "rajesh.sharma@novis.com" },
    },
  ],
  conv_02: [
    {
      id: "msg_201",
      conversationId: "conv_02",
      senderId: "usr_mgr_01",
      content: "Team, Q4 targets are live on your dashboards. Let us focus on secondary order booking.",
      messageType: "TEXT",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      sender: { id: "usr_mgr_01", firstName: "Dr. Rajesh", lastName: "Sharma", email: "rajesh.sharma@novis.com" },
    },
    {
      id: "msg_202",
      conversationId: "conv_02",
      senderId: "usr_mr_01",
      content: "📹 Video call ended • 14m 20s",
      messageType: "CALL_LOG",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      metadata: { callType: "VIDEO", durationSeconds: 860 },
      sender: { id: "usr_mr_01", firstName: "Priya", lastName: "Patel", email: "priya.patel@novis.com" },
    },
  ],
  conv_03: [
    {
      id: "msg_301",
      conversationId: "conv_03",
      senderId: "usr_mr_01",
      content: "Sent the visual aid slides to Dr. Shanmugam's clinic.",
      messageType: "TEXT",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      sender: { id: "usr_mr_01", firstName: "Priya", lastName: "Patel", email: "priya.patel@novis.com" },
    },
  ],
};

let activeMockCall: CallSession | null = null;
let mockCallSignals: Record<string, any[]> = {};

export const chatService = {
  /**
   * Get all active conversations
   */
  async getConversations(search?: string): Promise<Conversation[]> {
    try {
      const res = await apiClient.get<any>("/chat/conversations", {
        params: search ? { search } : undefined,
      });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      return mockConversations.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.lastMessageText && c.lastMessageText.toLowerCase().includes(q))
      );
    }
    return [...mockConversations];
  },

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get<any>(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit },
      });
      const data = res?.data || res;
      if (Array.isArray(data?.items)) {
        return data.items;
      }
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    return mockMessages[conversationId] || [];
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
    }
  ): Promise<ChatMessage> {
    try {
      const res = await apiClient.post<any>(`/chat/conversations/${conversationId}/messages`, payload);
      const data = res?.data || res;
      if (data && data.id) {
        return data;
      }
    } catch {
      // fallback
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: "curr_user",
      content: payload.content,
      messageType: payload.messageType || "TEXT",
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
      sender: {
        id: "curr_user",
        firstName: "You",
        lastName: "",
        email: "you@novis.com",
      },
    };

    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = [];
    }
    mockMessages[conversationId].push(newMsg);

    // Update conversation last message
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessageText = payload.content;
      conv.lastMessageAt = new Date().toISOString();
      conv.lastMessageSender = "You";
      conv.hasUnread = false;
    }

    return newMsg;
  },

  /**
   * Create or fetch 1-on-1 or group conversation
   */
  async createConversation(payload: {
    type?: "DIRECT" | "GROUP";
    recipientId?: string;
    participantIds?: string[];
    title?: string;
  }): Promise<Conversation> {
    const targetRecipientId =
      payload.recipientId ||
      (payload.type === "DIRECT" && payload.participantIds?.length === 1 ? payload.participantIds[0] : undefined) ||
      (payload.participantIds?.length === 1 && !payload.title ? payload.participantIds[0] : undefined);

    const isDirect = payload.type === "DIRECT" || Boolean(targetRecipientId && !payload.title);

    const normalizedPayload = {
      type: isDirect ? "DIRECT" : "GROUP",
      recipientId: isDirect ? targetRecipientId : undefined,
      participantIds: isDirect
        ? (targetRecipientId ? [targetRecipientId] : payload.participantIds)
        : (payload.participantIds || []),
      title: isDirect ? undefined : (payload.title?.trim() || "Team Channel"),
    };

    try {
      const res = await apiClient.post<any>("/chat/conversations", normalizedPayload);
      const data = res?.data || res;
      if (data && data.id) {
        return data;
      }
    } catch (err) {
      console.warn("Real POST /chat/conversations failed, using fallback:", err);
    }

    if (isDirect && targetRecipientId) {
      const contact = mockContacts.find((c) => c.id === targetRecipientId);
      const title = contact ? contact.name : "Colleague";
      const existing = mockConversations.find(
        (c) => c.type === "DIRECT" && c.participants.some((p) => p.userId === targetRecipientId)
      );
      if (existing) return existing;

      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        organizationId: "org_novis",
        type: "DIRECT",
        title,
        subtitle: contact?.roleLabel || "Colleague",
        avatarUrl: contact?.avatarUrl,
        isOnline: contact?.isOnline || false,
        lastMessageText: null,
        lastMessageAt: new Date().toISOString(),
        hasUnread: false,
        participantsCount: 2,
        participants: [
          { userId: "curr_user", name: "You", email: "you@novis.com", role: "MEMBER" },
          {
            userId: targetRecipientId,
            name: title,
            email: contact?.email || "",
            role: "MEMBER",
            userRole: contact?.role || "MR",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockConversations.unshift(newConv);
      mockMessages[newConv.id] = [];
      return newConv;
    }

    // Group
    const newGroup: Conversation = {
      id: `conv_grp_${Date.now()}`,
      organizationId: "org_novis",
      type: "GROUP",
      title: payload.title?.trim() || "Team Channel",
      subtitle: `${(payload.participantIds?.length || 0) + 1} members`,
      isOnline: false,
      lastMessageText: "Channel created",
      lastMessageAt: new Date().toISOString(),
      hasUnread: false,
      participantsCount: (payload.participantIds?.length || 0) + 1,
      participants: [
        { userId: "curr_user", name: "You", email: "you@novis.com", role: "ADMIN" },
        ...(payload.participantIds || []).map((id) => {
          const ct = mockContacts.find((c) => c.id === id);
          return {
            userId: id,
            name: ct?.name || "Colleague",
            email: ct?.email || "",
            role: "MEMBER",
            userRole: ct?.role || "MR",
          };
        }),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockConversations.unshift(newGroup);
    mockMessages[newGroup.id] = [];
    return newGroup;
  },

  /**
   * Mark as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.post(`/chat/conversations/${conversationId}/read`);
    } catch {
      // fallback
    }
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) conv.hasUnread = false;
  },

  /**
   * Get enterprise contacts / team directory
   */
  async getContacts(search?: string): Promise<ColleagueContact[]> {
    try {
      const res = await apiClient.get<any>("/chat/contacts", {
        params: search ? { search } : undefined,
      });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      return mockContacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.roleLabel.toLowerCase().includes(q) ||
          (c.headquarters && c.headquarters.toLowerCase().includes(q))
      );
    }
    return [...mockContacts];
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

    const contact = mockContacts.find((c) => c.id === payload.receiverId);
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
    try {
      const res = await apiClient.get<any>("/chat/calls/active");
      const data = res?.data || res;
      if (data && (data.id || data.callId)) {
        return {
          ...data,
          id: data.id || data.callId,
        };
      }
      return null;
    } catch {
      // fallback
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

