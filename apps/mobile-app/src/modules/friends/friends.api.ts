import axios from "axios";
import { CHAT_API_URL } from "../chat/chat.config";
import { ApiUser, ChatAuthIdentity, User } from "../chat/types";
import { getAccessToken } from "../../modules/api/token-store";

// 1. Khởi tạo client
const friendClient = axios.create({
  baseURL: CHAT_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Interceptor gắn token
friendClient.interceptors.request.use(async (config) => {
  try {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) { console.error("Lỗi lấy token:", error); }
  return config;
}, (error) => Promise.reject(error));

// Hàm hỗ trợ lỗi
function toErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeData = (error as any).response?.data;
    if (typeof maybeData === "string") return maybeData;
    if (typeof maybeData === "object") return maybeData.error || maybeData.message || "Lỗi server";
  }
  return error instanceof Error ? error.message : "Không thể kết nối đến Chat Service.";
}

// Đổi tham số identity: ChatAuthIdentity thành identity: any
function createIdentityHeaders(identity: any): Record<string, string> {
  return {
    "x-user-email": identity?.email || "",
    "x-user-code": identity?.code || "",
    "x-user-id": identity?._id || (identity?.id ? String(identity.id) : ""),
  };
}

// 🚀 BƯỚC 1: HÀM MAP PHẢI NẰM RIÊNG LẺ, KHÔNG NẰM TRONG HÀM KHÁC
export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    // 🚀 LẤY ĐÚNG CÁI BACKEND CẦN
    id: apiUser._id || String(apiUser.id), 
    _id: apiUser._id, // Nếu _id là undefined, thì đừng gửi nó đi!
    
    name: apiUser.fullName || apiUser.name || (apiUser.email ? apiUser.email.split('@')[0] : "Người dùng"),
    fullName: apiUser.fullName,
    email: apiUser.email,
    avatarUrl: apiUser.avatarUrl || `https://i.pravatar.cc/150?u=${apiUser._id || apiUser.id}`,
    isOnline: !!apiUser.isOnline,
    friendStatus: apiUser.friendStatus || 'none'
  };
}

// 2. Các hàm API khác
export const searchUsers = async (
  identity: ChatAuthIdentity, 
  keyword: string = ""
) => {
  const response = await friendClient.get(
    `/users/search?keyword=${encodeURIComponent(keyword)}`,
    { headers: createIdentityHeaders(identity) }
  ) as any;

  let userList = [];
  if (Array.isArray(response)) {
    userList = response;
  } else if (response?.data && Array.isArray(response.data)) {
    userList = response.data;
  } else if (response?.data?.data && Array.isArray(response.data.data)) {
    userList = response.data.data;
  }

  return userList.map(mapApiUserToUser); 
};

export async function fetchFriendRequests(identity: ChatAuthIdentity): Promise<any[]> {
  try {
    const response = await friendClient.get("/friend-requests", {
      headers: createIdentityHeaders(identity),
    });
    return response.data.data || [];
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

// Sửa lại hàm này trong friends.api.ts (Mobile)
export async function sendFriendRequest(
  identity: ChatAuthIdentity, 
  targetId: any 
): Promise<any> {
  try {
    // 🚀 BÍ KÍP CUỐI CÙNG: Nếu nó là số, ép nó về KIỂU SỐ (Number) luôn!
    // Tránh gửi chuỗi "2" để không bị dính "type string" như trong ảnh.
    const parsedId = isNaN(Number(targetId)) ? targetId : Number(targetId);
    
    const payload = { targetId: parsedId }; 

    const response = await friendClient.post("/friend-requests/send", payload, {
      headers: createIdentityHeaders(identity),
    });
    return response.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function acceptFriendRequest(identity: ChatAuthIdentity, requesterId: string): Promise<any> {
  try {
    const response = await friendClient.post("/friend-requests/accept", { requesterId }, {
      headers: createIdentityHeaders(identity),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function rejectFriendRequest(identity: ChatAuthIdentity, requesterId: string): Promise<void> {
  try {
    await friendClient.post("/friend-requests/reject", { requesterId }, {
      headers: createIdentityHeaders(identity),
    });
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}