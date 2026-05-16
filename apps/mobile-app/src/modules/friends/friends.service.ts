import axios from "axios";
// 🚨 Hậu kiểm tra lại đường dẫn import này cho đúng với cấu trúc thư mục thực tế nhé
import { CHAT_API_URL } from "../chat/chat.config"; 
import { ChatAuthIdentity } from "../chat/types";

// 1. KHỞI TẠO CLIENT GIỐNG HỆT CHAT CLIENT
const friendClient = axios.create({
  baseURL: CHAT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// 2. HÀM XỬ LÝ LỖI DÙNG CHUNG
function toErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeData = (error as { response?: { data?: { error?: string; message?: string } | string } }).response?.data;

    if (typeof maybeData === "string" && maybeData.length > 0) {
      return maybeData;
    }

    if (typeof maybeData === "object" && maybeData !== null) {
      if (typeof maybeData.error === "string" && maybeData.error.length > 0) {
        return maybeData.error;
      }
      if (typeof maybeData.message === "string" && maybeData.message.length > 0) {
        return maybeData.message;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể kết nối đến Chat Service.";
}

// 3. HÀM TẠO HEADER ĐỊNH DANH (Thay cho Bearer token)
function createIdentityHeaders(identity: ChatAuthIdentity): Record<string, string> {
  return {
    "x-user-email": identity.email,
    "x-user-code": identity.code || "",
  };
}

// ==========================================
// CÁC API CALL CHÍNH CHO BẠN BÈ VÀ LỜI MỜI
// ==========================================

/**
 * 🔍 Lấy danh sách user (để Tạo nhóm / Thêm thành viên)
 */
export async function searchUsers(
  identity: ChatAuthIdentity,
  keyword: string = ""
): Promise<any[]> {
  try {
    const response = await friendClient.get(`/users/search?keyword=${keyword}`, {
      headers: createIdentityHeaders(identity),
    });
    return response.data.data || [];
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 📋 Lấy danh sách lời mời kết bạn (pending)
 */
export async function getPendingFriendRequests(
  identity: ChatAuthIdentity
): Promise<any[]> {
  try {
    const response = await friendClient.get("/friend-requests", {
      headers: createIdentityHeaders(identity),
    });
    return response.data.data || [];
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 📤 Gửi lời mời kết bạn
 */
export async function sendFriendRequest(
  identity: ChatAuthIdentity,
  targetId: string
): Promise<any> {
  try {
    const response = await friendClient.post(
      "/friend-requests/send",
      { targetId },
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

/**
 * ✅ Chấp nhận lời mời kết bạn
 */
export async function acceptFriendRequest(
  identity: ChatAuthIdentity,
  requesterId: string
): Promise<any> {
  try {
    const response = await friendClient.post(
      "/friend-requests/accept",
      { requesterId },
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

/**
 * ❌ Từ chối lời mời kết bạn
 */
export async function rejectFriendRequest(
  identity: ChatAuthIdentity,
  requesterId: string
): Promise<void> {
  try {
    await friendClient.post(
      "/friend-requests/reject",
      { requesterId },
      { headers: createIdentityHeaders(identity) }
    );
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}