/**
 * 🛠️ Real-time Utilities Helper
 * Các function helper cho Friend System, Group Chat, và Member Management
 */

import { Socket } from "socket.io-client";
import { useSocket } from "../hooks/useSocket";
import { useFriendService } from "../hooks/useRealtimeServices";
import { useRealtimeServices } from "../hooks/useRealtimeServices";

/**
 * 🏗️ Initialize Real-time Services
 * Khởi tạo tất cả services cần thiết khi app start
 */
export async function initializeRealtimeServices(
  userId: string,
  userEmail: string,
  onConnectionEstablished?: () => void
) {
  try {
    // Socket connection sẽ được khởi tạo tự động trong useSocket hook
    // Khi userId và userEmail được set
    
    console.log("🚀 Initializing real-time services for:", userEmail);
    
    if (onConnectionEstablished) {
      // Có thể thêm callback khi connection established
      setTimeout(() => {
        onConnectionEstablished();
      }, 1000);
    }
  } catch (error) {
    console.error("❌ Failed to initialize real-time services:", error);
    throw error;
  }
}

/**
 * 📲 Subscribe to All Notifications
 * Lắng nghe tất cả các sự kiện real-time quan trọng
 */
export function subscribeToAllNotifications(
  friendService: any,
  onFriendRequest: (data: any) => void,
  onUserStatusChanged: (data: any) => void,
  onGroupMemberAdded: (data: any) => void,
  onGroupUpdated: (data: any) => void
) {
  const unsubscribers: Array<() => void> = [];

  if (friendService) {
    // Friend notifications
    unsubscribers.push(
      friendService.subscribe("friendRequestReceived", onFriendRequest)
    );
    unsubscribers.push(
      friendService.subscribe("userStatusChanged", onUserStatusChanged)
    );
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * 🔔 Show Friend Request Notification
 * Hiển thị badge/notification khi có lời mời kết bạn
 */
export function showFriendRequestNotification(
  data: any,
  badgeUpdateFn: (updater: (prev: number) => number) => void
) {
  const message = `${data.senderName} đã gửi lời mời kết bạn`;
  
  // Update badge
  badgeUpdateFn((prev) => prev + 1);
  
  // Log notification
  console.log("🔔 Friend Request:", message);
  
  // Có thể hiển thị toast/alert
  return message;
}

/**
 * 💬 Handle New Message in Group
 * Xử lý tin nhắn mới trong nhóm
 */
export function handleNewGroupMessage(
  message: any,
  currentUserId: string,
  messageList: any[],
  setMessageList: (messages: any[]) => void
) {
  // Tạo message object từ event data
  const newMessage = {
    id: message.id || generateRandomId(),
    groupId: message.groupId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatarUrl: message.senderAvatarUrl,
    content: message.content,
    createdAt: message.createdAt || new Date().toISOString(),
    status: message.status || "delivered",
    isOwn: message.senderId === currentUserId,
  };

  // Thêm vào danh sách messages
  setMessageList([...messageList, newMessage]);

  console.log("💬 New message received:", newMessage);
}

/**
 * ✏️ Handle User Typing Indicator
 * Hiển thị "User is typing..."
 */
export function handleUserTyping(
  data: any,
  typingUsers: Set<string>,
  setTypingUsers: (users: Set<string>) => void
) {
  const newTypingUsers = new Set(typingUsers);
  newTypingUsers.add(data.userId);
  setTypingUsers(newTypingUsers);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    const updatedUsers = new Set(newTypingUsers);
    updatedUsers.delete(data.userId);
    setTypingUsers(updatedUsers);
  }, 3000);
}

/**
 * 📊 Calculate Friend Stats
 * Tính toán thống kê bạn bè
 */
export function calculateFriendStats(
  friends: any[],
  pendingRequests: any[],
  sentRequests: any[]
) {
  return {
    totalFriends: friends.length,
    onlineFriends: friends.filter((f) => f.status === "online").length,
    offlineFriends: friends.filter((f) => f.status === "offline").length,
    pendingRequests: pendingRequests.length,
    sentRequests: sentRequests.length,
  };
}

/**
 * 🎯 Get Friend Request Status
 * Kiểm tra trạng thái kết bạn với người dùng
 */
export function getFriendRequestStatus(
  userId: string,
  friends: any[],
  pendingRequests: any[],
  sentRequests: any[]
) {
  // Check if already friend
  if (friends.some((f) => f.id === userId)) {
    return "friend";
  }

  // Check if pending request received
  if (pendingRequests.some((r) => r.senderId === userId)) {
    return "request_received";
  }

  // Check if sent request pending
  if (sentRequests.some((r) => r.receiverId === userId)) {
    return "request_sent";
  }

  return "not_friend";
}

/**
 * 👥 Format Group Members List
 * Format danh sách thành viên nhóm để hiển thị
 */
export function formatGroupMembers(members: any[]) {
  return members
    .sort((a, b) => {
      // Owner first, then admin, then members
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      return (roleOrder[a.role as keyof typeof roleOrder] ?? 3) - (roleOrder[b.role as keyof typeof roleOrder] ?? 3);
    })
    .map((member) => ({
      ...member,
      statusColor: member.status === "online" ? "#4CAF50" : "#999",
      roleLabel: member.role === "owner" ? "👑 Owner" : member.role === "admin" ? "⚙️ Admin" : "",
    }));
}

/**
 * 🔍 Search Friends
 * Tìm kiếm bạn bè trong danh sách
 */
export function searchFriends(
  friends: any[],
  query: string
) {
  if (!query.trim()) return friends;

  const lowerQuery = query.toLowerCase();
  return friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(lowerQuery) ||
      friend.email.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 🔐 Check Permission in Group
 * Kiểm tra quyền của user trong nhóm
 */
export function checkGroupPermission(
  currentUser: any,
  group: any,
  action: "delete" | "manage_members" | "edit_info" | "remove_member"
) {
  const memberRole = group.members.find((m: any) => m.userId === currentUser.id)?.role;

  switch (action) {
    case "delete":
      return memberRole === "owner";
    case "manage_members":
      return memberRole === "owner" || memberRole === "admin";
    case "edit_info":
      return memberRole === "owner";
    case "remove_member":
      return memberRole === "owner" || memberRole === "admin";
    default:
      return false;
  }
}

/**
 * 🎨 Get Status Color
 * Lấy màu sắc cho trạng thái online/offline
 */
export function getStatusColor(status: string) {
  const colors = {
    online: "#4CAF50",    // Green
    offline: "#999999",    // Gray
    away: "#FFC107",       // Yellow
    busy: "#F44336",       // Red
  };
  return colors[status as keyof typeof colors] || colors.offline;
}

/**
 * ⏰ Format Timestamp
 * Format thời gian để hiển thị
 */
export function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return "vừa xong";
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Format date
  return date.toLocaleDateString("vi-VN");
}

/**
 * 🎲 Generate Random ID
 * Tạo ID ngẫu nhiên cho messages tạm thời
 */
export function generateRandomId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 🧹 Cleanup Real-time Services
 * Cleanup khi logout
 */
export function cleanupRealtimeServices() {
  console.log("🧹 Cleaning up real-time services...");
  // Services sẽ được cleanup bên trong hooks
}

/**
 * ✔️ Validate Group Name
 * Kiểm tra tên nhóm hợp lệ
 */
export function validateGroupName(name: string) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Tên nhóm không được để trống" };
  }

  if (name.trim().length < 3) {
    return { valid: false, error: "Tên nhóm phải có ít nhất 3 ký tự" };
  }

  if (name.trim().length > 50) {
    return { valid: false, error: "Tên nhóm không được quá 50 ký tự" };
  }

  return { valid: true };
}

/**
 * ✔️ Validate Member List
 * Kiểm tra danh sách thành viên hợp lệ
 */
export function validateMemberList(memberIds: string[]) {
  if (!memberIds || memberIds.length === 0) {
    return { valid: false, error: "Phải chọn ít nhất 1 thành viên" };
  }

  if (memberIds.length > 100) {
    return { valid: false, error: "Không thể thêm hơn 100 thành viên" };
  }

  return { valid: true };
}
