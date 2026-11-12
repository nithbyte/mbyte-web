export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'LOCATION' | 'CALL_LOG';
export type ConversationType = 'DIRECT' | 'GROUP';
export type CallType = 'AUDIO' | 'VIDEO';
export type CallStatus = 'INITIATING' | 'RINGING' | 'CONNECTED' | 'REJECTED' | 'MISSED' | 'ENDED';

export interface ChatParticipant {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  userRole?: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  type: ConversationType;
  title: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
  isOnline?: boolean;
  lastMessageText?: string | null;
  lastMessageAt?: string;
  lastMessageSender?: string | null;
  hasUnread?: boolean;
  participantsCount: number;
  participants: ChatParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: ChatMessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: any;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface CallSession {
  id: string;
  conversationId: string;
  callerId: string;
  receiverId?: string;
  callType: CallType;
  status: CallStatus;
  channelName?: string;
  durationSeconds: number;
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  caller?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email: string;
  };
}

export interface ColleagueContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  roleLabel: string;
  headquarters?: string;
  designation?: string;
  isOnline: boolean;
}

