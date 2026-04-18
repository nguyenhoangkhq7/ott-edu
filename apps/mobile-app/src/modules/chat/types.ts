export type ChatAuthIdentity = {
  email: string;
  code?: string;
};

export type ChatConversationType = "private" | "class" | "group";

export type VideoCallStatus = "idle" | "calling" | "receiving" | "connected";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  code: string | null;
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
  email: string;
  code: string | null;
  avatarUrl: string | null;
}

export interface ApiConversation {
  _id: string;
  type: ChatConversationType;
  name?: string;
  participants: ApiUser[];
  avatarUrl: string | null;
}
