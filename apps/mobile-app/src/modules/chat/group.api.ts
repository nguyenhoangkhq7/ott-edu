import axios from "axios";
import { CHAT_API_URL } from "./chat.config"; // 🚨 Đảm bảo đường dẫn này đúng với file config của Hậu
import { ChatAuthIdentity } from "./types";
import {
  GroupConversation,
  CreateGroupPayload,
  UpdateGroupPayload,
  AddMembersPayload,
  GroupChatMember,
} from "./group.types";

/**
 * 💬 Group Chat API Client
 * Cắm thẳng vào CHAT_API_URL, dùng chung Header x-user-email
 */
import { getSharedChatConfig } from "./axiosClient";
import { getAccessToken } from "../../modules/api/token-store";

export const groupChatApiClient = axios.create({
  baseURL: CHAT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

groupChatApiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Lỗi lấy token:", error);
  }

  const sharedConfig = getSharedChatConfig();
  if (sharedConfig) {
    config.headers["x-user-email"] = sharedConfig.email || "";
    config.headers["x-user-code"] = sharedConfig.code || "";
    if (sharedConfig.fullName) {
      config.headers["x-user-name"] = encodeURIComponent(sharedConfig.fullName);
    }
    if (sharedConfig.avatarUrl) {
      config.headers["x-user-avatar"] = sharedConfig.avatarUrl;
    } else {
      delete config.headers["x-user-avatar"];
    }
  }

  return config;
}, (error) => Promise.reject(error));

// Hàm xử lý lỗi dùng chung (Copy từ chat api)
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

// Hàm tạo Header định danh
function createIdentityHeaders(identity: ChatAuthIdentity): Record<string, string> {
  return {
    "x-user-email": identity.email,
    "x-user-code": identity.code || "",
  };
}

/**
 * 🆕 Tạo nhóm chat mới
 * POST /conversations/group
 */
export async function createGroupConversation(
  identity: ChatAuthIdentity,
  payload: CreateGroupPayload
): Promise<GroupConversation> {
  try {
    const response = await groupChatApiClient.post<{ data: GroupConversation }>(
      "/conversations/group",
      payload,
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Failed to create group:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 📋 Lấy chi tiết nhóm
 * GET /conversations/:id
 */
export async function getGroupConversation(
  identity: ChatAuthIdentity,
  groupId: string
): Promise<GroupConversation> {
  try {
    const response = await groupChatApiClient.get<{ data: GroupConversation }>(
      `/conversations/${groupId}`,
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Failed to fetch group:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 📝 Cập nhật thông tin nhóm
 * PUT /conversations/:id
 */
export async function updateGroupConversation(
  identity: ChatAuthIdentity,
  groupId: string,
  payload: UpdateGroupPayload
): Promise<GroupConversation> {
  try {
    const response = await groupChatApiClient.put<{ data: GroupConversation }>(
      `/conversations/${groupId}`,
      payload,
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Failed to update group:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * ➕ Thêm thành viên vào nhóm
 * POST /conversations/:id/members
 */
export async function addGroupMembers(
  identity: ChatAuthIdentity,
  groupId: string,
  payload: any // Giữ type lỏng lẻo để bóc dữ liệu
): Promise<GroupChatMember[]> {
  try {
    let extractedId = "";

    // 🚀 FIX LỖI: Dò tìm ID người dùng từ các kiểu dữ liệu UI hay gửi xuống nhất
    if (payload?.participants && Array.isArray(payload.participants)) {
      // 🎯 BẮT TRÚNG BỆNH: Nếu UI bọc trong mảng "participants" (Giống y chang Log ông gửi)
      extractedId = payload.participants[0]; 
    } else if (typeof payload === "string") {
      extractedId = payload;
    } else if (Array.isArray(payload) && payload.length > 0) {
      extractedId = payload[0];
    } else if (payload && typeof payload === "object") {
      extractedId = payload.targetAccountId || payload.userId || payload.memberId || payload.id;
    }

    if (!extractedId) {
      // In rõ cái cục payload ra xem nó đang chứa cái gì để debug
      console.error("Payload UI đang gửi:", JSON.stringify(payload));
      throw new Error("Không tìm thấy ID thành viên để thêm vào nhóm");
    }

    // 🔥 Gửi đúng gói hàng { targetAccountId: ... } mà Backend đang đòi
    const formattedPayload = {
      targetAccountId: extractedId, // Tên biến gốc của Service
      accountId: extractedId,       // Tên rút gọn hay dùng nhất
      userId: extractedId,          // Tên phổ biến thứ 2
      targetUserId: extractedId,    // Tên theo chuẩn target
      memberId: extractedId,        // Tên theo UI
      participants: [extractedId]   // Dự phòng luôn trường hợp nó đòi mảng
    };

    console.log(`📤 Đang gửi lên Backend gói hàng:`, formattedPayload);

    const response = await groupChatApiClient.post<{ data: GroupChatMember[] }>(
      `/conversations/${groupId}/members`,
      formattedPayload,
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Lỗi từ Backend khi add thành viên:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 📋 Lấy danh sách thành viên nhóm
 * GET /conversations/:id/members
 */
export async function getGroupMembers(
  identity: ChatAuthIdentity,
  groupId: string
): Promise<GroupChatMember[]> {
  try {
    const response = await groupChatApiClient.get<{ data: GroupChatMember[] }>(
      `/conversations/${groupId}/members`,
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Failed to fetch members:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 🗑️ Xóa thành viên khỏi nhóm
 * DELETE /conversations/:id/members/:memberId
 */
export async function removeGroupMember(
  identity: ChatAuthIdentity,
  groupId: string,
  memberId: string
): Promise<void> {
  try {
    await groupChatApiClient.delete(`/conversations/${groupId}/members/${memberId}`, {
      headers: createIdentityHeaders(identity),
    });
  } catch (error: any) {
    console.error("❌ Failed to remove member:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 👤 Rời khỏi nhóm
 * DELETE /conversations/:id/leave
 */
export async function leaveGroup(
  identity: ChatAuthIdentity,
  groupId: string
): Promise<void> {
  try {
    await groupChatApiClient.delete(`/conversations/${groupId}/leave`, {
      headers: createIdentityHeaders(identity),
    });
  } catch (error: any) {
    console.error("❌ Failed to leave group:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 🗑️ Xóa nhóm (chỉ owner)
 * DELETE /conversations/:id
 */
export async function deleteGroup(
  identity: ChatAuthIdentity,
  groupId: string
): Promise<void> {
  try {
    await groupChatApiClient.delete(`/conversations/${groupId}`, {
      headers: createIdentityHeaders(identity),
    });
  } catch (error: any) {
    console.error("❌ Failed to delete group:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 👥 Thay đổi role thành viên (owner/admin only)
 * PATCH /conversations/:id/members/:memberId/role
 */
export async function changeGroupMemberRole(
  identity: ChatAuthIdentity,
  groupId: string,
  memberId: string,
  newRole: "owner" | "admin" | "member"
): Promise<GroupChatMember> {
  try {
    const response = await groupChatApiClient.patch<{ data: GroupChatMember }>(
      `/conversations/${groupId}/members/${memberId}/role`,
      { role: newRole },
      { headers: createIdentityHeaders(identity) }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Failed to change role:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}

/**
 * 📥 Lấy danh sách tất cả nhóm của user
 * GET /conversations?type=group
 */
export async function getUserGroups(
  identity: ChatAuthIdentity
): Promise<GroupConversation[]> {
  try {
    const response = await groupChatApiClient.get<{ data: GroupConversation[] }>(
      "/conversations",
      {
        params: { type: "group" },
        headers: createIdentityHeaders(identity),
      }
    );
    return response.data.data || (response.data as any);
  } catch (error: any) {
    console.error("❌ Failed to fetch user groups:", error.response?.data || error.message);
    throw new Error(toErrorMessage(error));
  }
}