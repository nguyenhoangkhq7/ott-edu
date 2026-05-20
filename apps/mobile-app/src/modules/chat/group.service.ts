import { Socket } from "socket.io-client";
import {
  createGroupConversation as apiCreateGroup,
  getGroupConversation as apiGetGroup,
  updateGroupConversation as apiUpdateGroup,
  addGroupMembers as apiAddMembers,
  getGroupMembers as apiGetMembers,
  removeGroupMember as apiRemoveMember,
  leaveGroup as apiLeaveGroup,
  deleteGroup as apiDeleteGroup,
  changeGroupMemberRole as apiChangeRole,
  getUserGroups as apiGetUserGroups,
} from "./group.api";
import {
  GroupConversation,
  CreateGroupPayload,
  UpdateGroupPayload,
  AddMembersPayload,
  GroupChatMember,
  GroupMemberAddedEvent,
  GroupMemberRemovedEvent,
  GroupMemberLeftEvent,
  GroupUpdatedEvent,
  GroupMessage,
} from "./group.types";
import { SOCKET_EVENTS } from "../../shared/constants/socket.config";
import { ChatAuthIdentity } from "./types"; // 🚀 IMPORT IDENTITY

/**
 * 💬 Group Chat Service
 * Kết hợp API + Real-time Socket Events
 */
export class GroupChatService {
  private socket: Socket | null = null;
  private identity: ChatAuthIdentity; // 🚀 Biến lưu trữ identity của user hiện tại
  private listeners: Map<string, Function[]> = new Map();

  // 🚀 Cập nhật constructor để nhận thêm identity
  constructor(socket: Socket | null, identity: ChatAuthIdentity) {
    this.socket = socket;
    this.identity = identity;
    this.setupSocketListeners();
  }

  /**
   * Setup Socket listeners cho Group Chat Events
   */
  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.GROUP_MEMBER_ADDED, (data: GroupMemberAddedEvent) => {
      console.log("👤 Group member added:", data);
      this.notifyListeners("memberAdded", data);
    });

    this.socket.on(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, (data: GroupMemberRemovedEvent) => {
      console.log("🗑️ Group member removed:", data);
      this.notifyListeners("memberRemoved", data);
    });

    this.socket.on(SOCKET_EVENTS.GROUP_MEMBER_LEFT, (data: GroupMemberLeftEvent) => {
      console.log("👋 Group member left:", data);
      this.notifyListeners("memberLeft", data);
    });

    this.socket.on(SOCKET_EVENTS.GROUP_UPDATED, (data: GroupUpdatedEvent) => {
      console.log("📝 Group updated:", data);
      this.notifyListeners("groupUpdated", data);
    });

    this.socket.on(SOCKET_EVENTS.NEW_MESSAGE, (data: GroupMessage) => {
      console.log("💬 New message in group:", data);
      this.notifyListeners("newMessage", data);
    });

    this.socket.on(SOCKET_EVENTS.TYPING, (data: { userId: string; groupId: string }) => {
      console.log("✏️ User typing:", data);
      this.notifyListeners("userTyping", data);
    });

    this.socket.on(SOCKET_EVENTS.STOP_TYPING, (data: { userId: string; groupId: string }) => {
      console.log("⏹️ User stopped typing:", data);
      this.notifyListeners("userStoppedTyping", data);
    });
  }

  /**
   * 🆕 Tạo nhóm chat mới
   */
  async createGroup(payload: CreateGroupPayload): Promise<GroupConversation> {
    try {
      console.log("🆕 Creating group:", payload);
      // 🚀 Truyền identity vào API
      const group = await apiCreateGroup(this.identity, payload);

      if (this.socket?.connected) {
        this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: group.id });
        console.log("✅ Joined group room:", group.id);
      }

      return group;
    } catch (error) {
      console.error("❌ Failed to create group:", error);
      throw error;
    }
  }

  /**
   * 📋 Lấy chi tiết nhóm
   */
  async getGroupDetails(groupId: string): Promise<GroupConversation> {
    try {
      return await apiGetGroup(this.identity, groupId); // 🚀 Truyền identity
    } catch (error) {
      console.error("❌ Failed to fetch group details:", error);
      throw error;
    }
  }

  /**
   * 📝 Cập nhật thông tin nhóm
   */
  async updateGroup(groupId: string, payload: UpdateGroupPayload): Promise<GroupConversation> {
    try {
      const updated = await apiUpdateGroup(this.identity, groupId, payload); // 🚀 Truyền identity

      if (this.socket?.connected) {
        this.socket.emit("group_updated", { groupId, changes: payload });
      }

      return updated;
    } catch (error) {
      console.error("❌ Failed to update group:", error);
      throw error;
    }
  }

  /**
   * ➕ Thêm thành viên vào nhóm
   */
  async addMembers(groupId: string, payload: AddMembersPayload): Promise<GroupChatMember[]> {
    try {
      console.log("➕ Adding members to group:", groupId, payload);
      const members = await apiAddMembers(this.identity, groupId, payload); // 🚀 Truyền identity

      if (this.socket?.connected) {
        this.socket.emit("members_added", { groupId, memberIds: payload.memberIds });
      }

      return members;
    } catch (error) {
      console.error("❌ Failed to add members:", error);
      throw error;
    }
  }

  /**
   * 📋 Lấy danh sách thành viên nhóm
   */
  async getMembers(groupId: string): Promise<GroupChatMember[]> {
    try {
      return await apiGetMembers(this.identity, groupId); // 🚀 Truyền identity
    } catch (error) {
      console.error("❌ Failed to fetch group members:", error);
      throw error;
    }
  }

  /**
   * 🗑️ Xóa thành viên khỏi nhóm
   */
  async removeMember(groupId: string, memberId: string): Promise<void> {
    try {
      await apiRemoveMember(this.identity, groupId, memberId); // 🚀 Truyền identity

      if (this.socket?.connected) {
        this.socket.emit("member_removed", { groupId, memberId });
      }
    } catch (error) {
      console.error("❌ Failed to remove member:", error);
      throw error;
    }
  }

  /**
   * 👤 Rời khỏi nhóm
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      await apiLeaveGroup(this.identity, groupId); // 🚀 Truyền identity

      if (this.socket?.connected) {
        this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: groupId });
      }
    } catch (error) {
      console.error("❌ Failed to leave group:", error);
      throw error;
    }
  }

  /**
   * 🗑️ Xóa nhóm (chỉ owner)
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      await apiDeleteGroup(this.identity, groupId); // 🚀 Truyền identity

      if (this.socket?.connected) {
        this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: groupId });
      }
    } catch (error) {
      console.error("❌ Failed to delete group:", error);
      throw error;
    }
  }

  /**
   * 👥 Thay đổi role thành viên
   */
  async changeRole(groupId: string, memberId: string, newRole: "owner" | "admin" | "member"): Promise<GroupChatMember> {
    try {
      const member = await apiChangeRole(this.identity, groupId, memberId, newRole); // 🚀 Truyền identity

      if (this.socket?.connected) {
        this.socket.emit("member_role_changed", { groupId, memberId, newRole });
      }

      return member;
    } catch (error) {
      console.error("❌ Failed to change member role:", error);
      throw error;
    }
  }

  /**
   * 📥 Lấy tất cả nhóm của user
   */
  async getUserGroups(): Promise<GroupConversation[]> {
    try {
      return await apiGetUserGroups(this.identity); // 🚀 Truyền identity
    } catch (error) {
      console.error("❌ Failed to fetch user groups:", error);
      throw error;
    }
  }

  /**
   * 💬 Gửi tin nhắn đến nhóm
   */
  sendMessage(groupId: string, content: string, attachments?: any[]): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.NEW_MESSAGE, {
        roomId: groupId,
        content,
        attachments,
        timestamp: new Date().toISOString(),
      });
      console.log("💬 Message sent to group:", groupId);
    } else {
      console.warn("⚠️ Socket not connected, cannot send message");
    }
  }

  /**
   * ✏️ Emit typing event
   */
  notifyTyping(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.TYPING, { roomId: groupId });
    }
  }

  /**
   * ⏹️ Emit stop typing event
   */
  notifyStoppedTyping(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.STOP_TYPING, { roomId: groupId });
    }
  }

  /**
   * 👂 Subscribe to group events
   */
  subscribe(
    event: "memberAdded" | "memberRemoved" | "memberLeft" | "groupUpdated" | "newMessage" | "userTyping" | "userStoppedTyping",
    listener: (data: any) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(event: string, data: any) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in listener for ${event}:`, error);
      }
    });
  }

  destroy() {
    this.listeners.clear();
  }
}

// Singleton instance
let groupChatServiceInstance: GroupChatService | null = null;

/**
 * 🚀 Get or create GroupChatService instance (Đã yêu cầu thêm identity)
 */
export function getGroupChatService(socket: Socket | null, identity: ChatAuthIdentity): GroupChatService {
  if (!groupChatServiceInstance) {
    groupChatServiceInstance = new GroupChatService(socket, identity);
  }
  return groupChatServiceInstance;
}

export function resetGroupChatService() {
  if (groupChatServiceInstance) {
    groupChatServiceInstance.destroy();
    groupChatServiceInstance = null;
  }
}