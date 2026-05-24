import axios from "axios";
import { CHAT_API_URL } from "../chat/chat.config"; // 🚨 Check lại đường dẫn config
import { ChatAuthIdentity } from "../chat/types";
// 👇 1. IMPORT HÀM LẤY TOKEN (Hậu check lại đường dẫn này cho khớp project nha)
import { getAccessToken } from "../../modules/api/token-store"; 

// 1. Khởi tạo client dùng chung cấu hình với Chat Service
const friendClient = axios.create({
  baseURL: CHAT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// 👇 2. BỘ LỌC TỰ ĐỘNG GẮN TOKEN ĐỂ VƯỢT ẢI 401 UNAUTHORIZED
friendClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken(); // Lấy token từ bộ nhớ
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Lỗi lấy token cho friendClient:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Hàm xử lý lỗi "chuẩn" của hệ thống
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
  if (error instanceof Error) return error.message;
  return "Không thể kết nối đến Chat Service.";
}

// 4. Hàm tạo Header định danh (x-user-email)
function createIdentityHeaders(identity: ChatAuthIdentity): Record<string, string> {
  return {
    "x-user-email": identity.email,
    "x-user-code": identity.code || "",
  };
}

/**
 * 🔍 Tìm kiếm người dùng (Dùng để tạo nhóm/thêm thành viên giống Web)
 * GET /api/users/search
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
 * GET /api/friend-requests
 */
export async function fetchFriendRequests(
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
 * POST /api/friend-requests/send
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
 * POST /api/friend-requests/accept
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
 * POST /api/friend-requests/reject
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