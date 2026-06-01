export type ChatAuthIdentity = {
  email: string;
  code?: string;
};

export type ChatMode = "private" | "class" | "group";
export type ChatConversationType = ChatMode | "group";

export type VideoCallStatus = "idle" | "calling" | "receiving" | "connected";
export type MediaCallKind = "audio" | "video";

export interface CallHistoryItem {
  _id: string;
  callId: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  callType?: MediaCallKind;
  status: "ringing" | "connected" | "ended" | "declined" | "unavailable" | "failed";
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  durationSec: number;
  endReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  fullName?: string;
  email?: string;
  code?: string;
  role?: string;
  avatarUrl: string;
  isOnline: boolean;
  friendStatus?: "none" | "pending" | "friend";
}

export interface Attachment {
  url: string;
  fileType: string;
  fileName: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
  attachments?: Attachment[];
  linkPreview?: LinkPreview;
  replyTo?: Message | null;
  isRevoked: boolean;
  revokedFor: string[];
  isForwarded?: boolean;
  reactions: Reaction[];
  type?: 'text' | 'system';
}

export interface Conversation {
  id: string;
  name: string | null;
  type: ChatMode;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  avatarUrl: string | null;
  ownerId?: string | null;
  deputyId?: string | null;
  myRole?: "owner" | "member" | null;
  canManageGroup?: boolean;
  onlyAdminCanMessage?: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  code?: string;
  avatarUrl: string | null;
}

export interface ChatConversation {
  id: string;
  type: ChatConversationType;
  name: string;
  participants: ChatUser[];
  avatarUrl: string | null;
}

export interface IncomingVideoCall {
  callId: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  initiatedAt?: string;
  callType?: MediaCallKind;
  isPrivate?: boolean;
}

export interface ActiveVideoCall {
  callId: string;
  conversationId: string;
  peerUserId: string;
  direction: "incoming" | "outgoing";
  callType?: MediaCallKind;
}

export interface ApiUser {
  _id: string;
  id: string;
  fullName: string;
  name?: string;          // Thêm cái này
  email?: string;
  code?: string;
  role?: string;          // Thêm cái này
  avatarUrl?: string;
  isOnline?: boolean;     // Thêm cái này
  friendStatus?: "none" | "pending" | "friend";
}

export interface ApiAttachment {
  url: string;
  fileType: string;
  fileName: string;
}

export interface ApiReaction {
  userId: string;
  emoji: string;
}

export interface ApiMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: ApiAttachment[];
  linkPreview?: LinkPreview;
  replyTo?: ApiMessage | null;
  isRevoked: boolean;
  revokedFor?: string[];
  _hiddenForMe?: boolean;
  isForwarded?: boolean;
  reactions: ApiReaction[];
  type?: 'text' | 'system';
}

export interface ApiConversation {
  _id: string;
  type: ChatConversationType;
  name?: string;
  avatarUrl?: string | null;
  ownerId?: string | null;
  deputyId?: string | null;
  myRole?: "owner" | "member" | null;
  canManageGroup?: boolean;
  onlyAdminCanMessage?: boolean;
  metadata?: unknown;
  participants: ApiUser[];
  lastMessage?: ApiMessage | null;
  otherParticipant?: ApiUser;
  createdAt?: string;
  updatedAt?: string;
}
