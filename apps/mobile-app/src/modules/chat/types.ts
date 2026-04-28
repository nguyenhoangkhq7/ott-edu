export type ChatAuthIdentity = {
  email: string;
  code?: string;
};

export type ChatMode = "private" | "class";
export type ChatConversationType = ChatMode | "group";

export type VideoCallStatus = "idle" | "calling" | "receiving" | "connected";

export interface User {
  id: string;
  name: string;
  email?: string;
  code?: string;
  role?: string;
  avatarUrl: string;
  isOnline: boolean;
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

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
  attachments?: Attachment[];
  replyTo?: Message | null;
  isRevoked: boolean;
  revokedFor: string[];
  isForwarded?: boolean;
  reactions: Reaction[];
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
  myRole?: "owner" | "member" | null;
  canManageGroup?: boolean;
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
}

export interface ActiveVideoCall {
  callId: string;
  conversationId: string;
  peerUserId: string;
  direction: "incoming" | "outgoing";
}

export interface ApiUser {
  _id: string;
  fullName: string;
  email?: string;
  code?: string;
  avatarUrl?: string;
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
  replyTo?: ApiMessage | null;
  isRevoked: boolean;
  revokedFor?: string[];
  _hiddenForMe?: boolean;
  isForwarded?: boolean;
  reactions: ApiReaction[];
}

export interface ApiConversation {
  _id: string;
  type: ChatConversationType;
  name?: string;
  avatarUrl?: string;
  ownerId?: string | null;
  myRole?: "owner" | "member" | null;
  canManageGroup?: boolean;
  metadata?: unknown;
  participants: ApiUser[];
  lastMessage?: ApiMessage | null;
  otherParticipant?: ApiUser;
  createdAt?: string;
  updatedAt?: string;
}
