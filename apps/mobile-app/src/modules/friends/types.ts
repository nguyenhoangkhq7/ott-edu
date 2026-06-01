/**
 * 👥 Friend System Types
 */

export type FriendRequest = {
  id: string;      // ID số (nếu có từ MySQL)
  _id?: string;    // ID MongoDB (cực kỳ quan trọng để fix lỗi Cast ObjectId)
  senderId: string;
  receiverId: string;
  senderName: string;
  senderEmail: string;
  senderAvatarUrl?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type Friend = {
  id: string;
  _id?: string;    // Thêm _id
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away";
  isFriend: boolean;
  friendRequestSent?: boolean;
};

export type FriendStats = {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
};

export type SendFriendRequestPayload = {
  receiverId: string;
};

export type AcceptFriendRequestPayload = {
  requestId: string;
};

export type RejectFriendRequestPayload = {
  requestId: string;
};

export type RemoveFriendPayload = {
  friendId: string;
};

// Realtime event payloads
export type FriendRequestReceivedEvent = {
  requestId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatarUrl?: string;
  createdAt: string;
};

export type FriendRequestAcceptedEvent = {
  requestId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
};

export type UserStatusChangeEvent = {
  userId: string;
  status: "online" | "offline" | "away";
  lastSeenAt?: string;
};
