// ─── Frontend UI Types ──────────────────────────────────────────────────────
// Đây là interface dùng cho component hiển thị.
// Dữ liệu từ API sẽ được transform sang format này qua các helper ở chatApi.ts.

export type ChatMode = "private" | "class";

export interface User {
  id: string;           // mapped từ _id của MongoDB
  name: string;         // mapped từ fullName của MongoDB
  avatarUrl: string;
  isOnline: boolean;
}

export interface Message {
  id: string;           // mapped từ _id của MongoDB
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;           // mapped từ _id
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
  avatarUrl?: string;
}

export interface ApiMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiConversation {
  _id: string;
  type: "private" | "class";
  name?: string;
  avatarUrl?: string;
  metadata?: any;
  participants: ApiUser[];
  lastMessage?: ApiMessage | null;
  otherParticipant?: ApiUser;  // Được tính sẵn trong ChatService.getConversations()
  createdAt?: string;
  updatedAt?: string;
}

