import Constants from "expo-constants";

/**
 * Socket.IO Configuration
 * 🔧 Bắt buộc sử dụng IP 10.247.126.125:3001
 * 🚀 Transports: websocket để đảm bảo tốc độ cao nhất
 * 💾 Singleton pattern: Chỉ 1 kết nối duy nhất cho toàn bộ App
 */

// Get environment variable or fallback
const ENV_SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(":")[0];

/**
 * Socket Server URL: 10.247.126.125:3001
 * Không dùng localhost, bắt buộc dùng IP thực
 */
export const SOCKET_SERVER_URL =
  ENV_SOCKET_URL ||
  "http://10.247.126.125:3001";

/**
 * Socket.IO Configuration Options
 * ✅ transports: ['websocket'] - Đảm bảo tốc độ cao nhất
 * ✅ reconnection: true - Tự động kết nối lại khi mất mạng
 * ✅ reconnectionDelay: 1000 - Delay 1s trước khi reconnect
 * ✅ reconnectionAttempts: 5 - Thử 5 lần rồi dừng
 */
export const SOCKET_IO_CONFIG = {
  transports: ["websocket"] as const,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000,
  autoConnect: false, // Manual connection for better control
  upgrade: false, // Disable HTTP long-polling fallback
  forceNew: false, // Reuse connection (Singleton)
};

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // Chat events
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  NEW_MESSAGE: "newMessage",
  MESSAGE_RECEIVED: "message_received",
  TYPING: "typing",
  STOP_TYPING: "stop_typing",

  // Friend system events
  FRIEND_REQUEST_RECEIVED: "friend_request_received",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  FRIEND_REQUEST_REJECTED: "friend_request_rejected",

  // Group events
  GROUP_CREATED: "group_created",
  GROUP_MEMBER_ADDED: "group_member_added",
  GROUP_MEMBER_REMOVED: "group_member_removed",
  GROUP_MEMBER_LEFT: "group_member_left",
  GROUP_UPDATED: "group_updated",

  // User presence
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  USER_STATUS_CHANGED: "user_status_changed",
};

console.log("🔌 Socket.IO Server URL:", SOCKET_SERVER_URL);
