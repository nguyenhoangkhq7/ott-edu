// ─── Frontend UI Types ──────────────────────────────────────────────────────
// Đây là interface dùng cho component hiển thị.
// Dữ liệu từ API sẽ được transform sang format này qua các helper ở chatApi.ts.

export type ChatMode = "private" | "class";

export interface User {
  id: string; // mapped từ _id của MongoDB
  name: string; // mapped từ fullName của MongoDB
  email?: string;
  code?: string; // MSSV / MSGV
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

// Link Preview Data Type
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
  linkPreview?: LinkPreview; // Thêm link preview field
  replyTo?: Message | null;
  /** Thu hồi với tất cả */
  isRevoked: boolean;
  /** Danh sách userId đã tự thu hồi về phía mình */
  revokedFor: string[];
  /** Đánh dấu tin nhắn chuyển tiếp */
  isForwarded?: boolean;
  reactions: Reaction[];
}

export interface Conversation {
  id: string; // mapped từ _id
  name: string | null;
  type: ChatMode;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  avatarUrl: string | null;
}

// ─── Raw API Response Types (từ backend MongoDB) ────────────────────────────

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

// API Link Preview Data Type
export interface ApiLinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface ApiMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: ApiAttachment[];
  linkPreview?: ApiLinkPreview; // Thêm link preview field
  replyTo?: ApiMessage | null;
  isRevoked: boolean;
  revokedFor?: string[];
  /** Backend set true khi message này user hiện tại đã ẩn với mình */
  _hiddenForMe?: boolean;
  isForwarded?: boolean;
  reactions: ApiReaction[];
}

export interface ApiConversation {
  _id: string;
  type: "private" | "class";
  name?: string;
  avatarUrl?: string;
  metadata?: unknown;
  participants: ApiUser[];
  lastMessage?: ApiMessage | null;
  otherParticipant?: ApiUser; // Được tính sẵn trong ChatService.getConversations()
  createdAt?: string;
  updatedAt?: string;
}
