/**
 * 💬 Group Chat Types
 * Các kiểu dữ liệu cho tính năng tạo nhóm, quản lý thành viên, gửi tin nhắn
 */

export type GroupChatMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  status: "online" | "offline" | "away";
};

export type GroupConversation = {
  id: string;
  name: string;
  description?: string;
  type: "group";
  members: GroupChatMember[];
  memberCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
};

export type CreateGroupPayload = {
  name: string;
  description?: string;
  memberIds: string[]; // List of user IDs to add to group
};

export type UpdateGroupPayload = {
  name?: string;
  description?: string;
  avatarUrl?: string;
};

export type AddMembersPayload = {
  memberIds: string[];
};

export type RemoveMemberPayload = {
  memberId: string;
};

export type ChangeRolePayload = {
  memberId: string;
  newRole: "owner" | "admin" | "member";
};

export type GroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
  }[];
  createdAt: string;
  status: "sent" | "delivered" | "read";
};

export type GroupMemberAddedEvent = {
  groupId: string;
  memberId: string;
  memberName: string;
  memberAvatarUrl?: string;
  addedBy: string;
  addedAt: string;
};

export type GroupMemberRemovedEvent = {
  groupId: string;
  memberId: string;
  memberName: string;
  removedBy: string;
  removedAt: string;
};

export type GroupMemberLeftEvent = {
  groupId: string;
  memberId: string;
  memberName: string;
  leftAt: string;
};

export type GroupUpdatedEvent = {
  groupId: string;
  updatedBy: string;
  changes: {
    name?: string;
    description?: string;
    avatarUrl?: string;
  };
  updatedAt: string;
};
