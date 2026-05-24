import { chatHttpService } from "@/services/api";
import {
  ApiConversation,
  ApiMessage,
  ApiUser,
  Attachment,
  CallHistoryItem,
  Conversation,
  Message,
  User,
} from "./types";

// ─── Data Transformers (API → UI) ───────────────────────────────────────────

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser._id,
    name: apiUser.fullName,
    email: apiUser.email,
    code: apiUser.code,
    role: apiUser.role,
    avatarUrl:
      apiUser.avatarUrl || `https://i.pravatar.cc/150?u=${apiUser._id}`,
    isOnline: apiUser.isOnline ?? false,
    friendStatus: apiUser.friendStatus || "none",
  };
}

export type ChatAuthIdentity = {
  email: string;
  code?: string;
};

export function mapApiMessageToMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg._id,
    conversationId: apiMsg.conversationId,
    senderId: apiMsg.senderId,
    content: apiMsg.content,
    createdAt: apiMsg.createdAt,
    status: "sent",
    attachments: apiMsg.attachments || [],
    linkPreview: apiMsg.linkPreview || undefined, // 👈 Thêm linkPreview mapping
    replyTo: apiMsg.replyTo ? mapApiMessageToMessage(apiMsg.replyTo) : null,
    isRevoked: apiMsg.isRevoked || false,
    // _hiddenForMe: server đã xác nhận user này đã ẩn tin nhắn, dùng marker "__self__" trong revokedFor
    revokedFor: apiMsg._hiddenForMe ? ["__self__"] : (apiMsg.revokedFor || []),
    isForwarded: apiMsg.isForwarded || false,
    reactions: apiMsg.reactions || [],
  };
}

export function mapApiConversationToConversation(
  apiConv: ApiConversation,
  currentUserId: string,
): Conversation {
  const participants = apiConv.participants.map(mapApiUserToUser);
  const type = apiConv.type;

  let name: string | null = apiConv.name || null;

  if (type === "private") {
    const other = participants.find((p) => p.id !== currentUserId);
    name = other?.name || null;
  }

  const lastMsg = apiConv.lastMessage
    ? mapApiMessageToMessage(apiConv.lastMessage)
    : null;

  return {
    id: apiConv._id,
    name,
    type,
    participants,
    lastMessage: lastMsg,
    unreadCount: 0,
    avatarUrl:
      apiConv.avatarUrl ||
      (type === "class" ? `https://i.pravatar.cc/150?img=30` : null),
    ownerId: apiConv.ownerId || null,
    deputyId: apiConv.deputyId || null,
    joinPolicy: apiConv.joinPolicy || "open",
    pendingMemberRequests: apiConv.pendingMemberRequests || [],
    myRole: apiConv.myRole || null,
    canManageGroup:
      apiConv.canManageGroup ??
      (apiConv.myRole === "owner" || apiConv.myRole === "deputy"),
    otherParticipant: type === "private" 
      ? participants.find((p) => p.id !== currentUserId) 
      : null,
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * GET /api/conversations
 * Lấy danh sách cuộc trò chuyện của user hiện tại.
 * Yêu cầu: x-user-id header được gắn bởi Axios interceptor.
 */
export async function fetchConversations(
  currentUserId: string,
): Promise<Conversation[]> {
  const data = await chatHttpService.get<{ data: ApiConversation[] }>(
    "/conversations",
  );
  return data.data.map((conv) =>
    mapApiConversationToConversation(conv, currentUserId),
  );
}

/**
 * GET /api/me
 * Resolve chat user từ identity của AuthProvider.
 */
export async function fetchCurrentChatUser(
  identity: ChatAuthIdentity,
): Promise<User> {
  const data = await chatHttpService.get<{ data: ApiUser }>("/me", {
    headers: {
      "x-user-email": identity.email,
      "x-user-code": identity.code || "",
    },
  });

  return mapApiUserToUser(data.data);
}

/**
 * GET /api/messages/:conversationId
 * Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện.
 */
export async function fetchMessages(
  conversationId: string,
): Promise<Message[]> {
  const data = await chatHttpService.get<{ data: ApiMessage[] }>(
    `/messages/${conversationId}`,
  );
  return data.data.map(mapApiMessageToMessage);
}

/**
 * GET /api/upload-url
 * Lấy presigned URL để upload file trực tiếp lên S3
 */
export async function getPresignedUrl(
  fileName: string,
  fileType: string,
): Promise<{
  presignedUrl: string;
  fileUrl: string;
  s3Key: string;
  expiresIn: number;
}> {
  const data = await chatHttpService.get<{
    data: {
      presignedUrl: string;
      fileUrl: string;
      s3Key: string;
      expiresIn: number;
    };
  }>("/upload-url", {
    params: { fileName, fileType },
  });
  return data.data;
}

/**
 * PUT to S3 presigned URL
 * Upload file trực tiếp lên S3
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File,
): Promise<void> {
  try {
    await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * POST /api/upload-file
 * Upload file qua chat-service (server-side), rồi server đẩy lên S3.
 * Cách này tránh lỗi CORS từ browser -> S3.
 */
export async function uploadFileToChatService(file: File): Promise<{
  fileUrl: string;
  s3Key: string;
}> {
  const data = await chatHttpService.post<{
    data: { fileUrl: string; s3Key: string };
  }>("/upload-file", file, {
    params: { fileName: file.name, fileType: file.type },
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  return data.data;
}

/**
 * POST /api/messages
 * Gửi tin nhắn mới tới người nhận HOẶC nhóm với hỗ trợ attachments và replies
 */
export async function sendMessage(
  content: string,
  receiverId?: string,
  conversationId?: string,
  attachments?: Attachment[],
  replyToMessageId?: string,
  isForwarded?: boolean,
): Promise<Message> {
  const data = await chatHttpService.post<{ data: ApiMessage }>("/messages", {
    receiverId,
    conversationId,
    content,
    attachments,
    replyTo: replyToMessageId,
    isForwarded,
  });
  return mapApiMessageToMessage(data.data);
}

/**
 * GET /api/calls/history
 * Lấy lịch sử cuộc gọi gần nhất của user hiện tại.
 */
export async function fetchCallHistory(params?: {
  conversationId?: string;
  limit?: number;
  page?: number;
  status?: "ringing" | "connected" | "ended" | "declined" | "unavailable" | "failed";
}): Promise<{
  items: CallHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const data = await chatHttpService.get<{
    data: CallHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    "/calls/history",
    {
      params: {
        conversationId: params?.conversationId,
        limit: params?.limit,
        page: params?.page,
        status: params?.status,
      },
    },
  );

  return {
    items: data.data,
    pagination: data.pagination,
  };
}

/**
 * POST /api/conversations/group
 * Tạo group chat mới, người tạo sẽ là owner.
 */
export async function createGroupConversation(payload: {
  name: string;
  participants: string[];
  avatarUrl?: string;
  metadata?: unknown;
  joinPolicy?: "open" | "approval";
}): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    "/conversations/group",
    payload,
  );

  return mapApiConversationToConversation(data.data, "");
}

export async function updateGroupJoinPolicy(
  conversationId: string,
  joinPolicy: "open" | "approval",
): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    `/conversations/${conversationId}/join-policy`,
    { joinPolicy },
  );

  return mapApiConversationToConversation(data.data, "");
}

export async function requestOrAddGroupMember(
  conversationId: string,
  payload: { email?: string; accountId?: string },
): Promise<{
  conversation: Conversation;
  mode: "added" | "requested";
}> {
  const data = await chatHttpService.post<{
    data: { conversation: ApiConversation; mode: "added" | "requested" };
  }>(`/conversations/${conversationId}/members`, payload);

  return {
    conversation: mapApiConversationToConversation(data.data.conversation, ""),
    mode: data.data.mode,
  };
}

export async function approveGroupMemberRequest(
  conversationId: string,
  requestId: string,
): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    `/conversations/${conversationId}/member-requests/${requestId}/approve`,
    {},
  );

  return mapApiConversationToConversation(data.data, "");
}

export async function rejectGroupMemberRequest(
  conversationId: string,
  requestId: string,
): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    `/conversations/${conversationId}/member-requests/${requestId}/reject`,
    {},
  );

  return mapApiConversationToConversation(data.data, "");
}

/**
 * GET /api/conversations/:conversationId/role
 * Lấy role của user hiện tại trong group chat.
 */
export async function fetchConversationRole(conversationId: string): Promise<{
  conversationId: string;
  ownerId: string | null;
  deputyId: string | null;
  joinPolicy: "open" | "approval";
  myRole: "owner" | "deputy" | "member" | null;
  canManageGroup: boolean;
}> {
  const data = await chatHttpService.get<{
    data: {
      conversationId: string;
      ownerId: string | null;
      deputyId: string | null;
      joinPolicy: "open" | "approval";
      myRole: "owner" | "deputy" | "member" | null;
      canManageGroup: boolean;
    };
  }>(`/conversations/${conversationId}/role`);

  return data.data;
}

/**
 * POST /api/conversations/:conversationId/members/:memberId/remove
 * Owner xóa member khỏi nhóm.
 */
export async function removeGroupMember(
  conversationId: string,
  memberId: string,
): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    `/conversations/${conversationId}/members/${memberId}/remove`,
  );

  return mapApiConversationToConversation(data.data, memberId);
}

/**
 * POST /api/conversations/:conversationId/deputy
 * Owner cấp hoặc gỡ phó nhóm.
 */
export async function setGroupDeputy(
  conversationId: string,
  deputyId?: string | null,
): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    `/conversations/${conversationId}/deputy`,
    deputyId ? { deputyId } : { deputyId: null },
  );

  return mapApiConversationToConversation(data.data, deputyId || "");
}

/**
 * POST /api/conversations/:conversationId/dissolve
 * Owner giải tán nhóm.
 */
export async function dissolveGroup(conversationId: string): Promise<void> {
  await chatHttpService.post(`/conversations/${conversationId}/dissolve`, {});
}

/**
 * POST /api/conversations/:conversationId/leave
 * Rời group chat. Nếu là owner thì truyền newOwnerId để chuyển quyền trước.
 */
export async function leaveGroup(
  conversationId: string,
  newOwnerId?: string,
): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    `/conversations/${conversationId}/leave`,
    newOwnerId ? { newOwnerId } : {},
  );

  return mapApiConversationToConversation(data.data, "");
}

/**
 * GET /api/chat/info/:conversationId
 * Lấy thông tin chi tiết của conversation (participants, settings, etc.)
 */
export async function fetchConversationInfo(
  conversationId: string,
): Promise<{
  conversationId: string;
  name: string;
  avatarUrl: string;
  type: "private" | "class";
  ownerId: string | null;
  deputyId: string | null;
  joinPolicy: "open" | "approval";
  participants: Array<{
    _id: string;
    fullName: string;
    avatarUrl: string;
    email: string;
  }>;
  totalMembers: number;
}> {
  const data = await chatHttpService.get<{
    data: {
      conversationId: string;
      name: string;
      avatarUrl: string;
      type: "private" | "class";
      ownerId: string | null;
      deputyId: string | null;
      joinPolicy: "open" | "approval";
      participants: Array<{
        _id: string;
        fullName: string;
        avatarUrl: string;
        email: string;
      }>;
      totalMembers: number;
    };
  }>(`/chat/info/${conversationId}`);

  return data.data;
}

/**
 * GET /api/chat/info/:conversationId/media
 * Lấy danh sách message chứa media (images, videos) từ conversation
 */
export async function fetchMediaItems(
  conversationId: string,
  limit = 50,
): Promise<ApiMessage[]> {
  const data = await chatHttpService.get<{ data: ApiMessage[] }>(
    `/chat/info/${conversationId}/media`,
    { params: { limit } },
  );

  return data.data || [];
}

/**
 * GET /api/chat/info/:conversationId/files
 * Lấy danh sách message chứa files (documents) từ conversation
 */
export async function fetchFileItems(
  conversationId: string,
  limit = 50,
): Promise<ApiMessage[]> {
  const data = await chatHttpService.get<{ data: ApiMessage[] }>(
    `/chat/info/${conversationId}/files`,
    { params: { limit } },
  );

  return data.data || [];
}

/**
 * GET /api/chat/info/:conversationId/links
 * Lấy danh sách message chứa links từ conversation
 */
export async function fetchLinkItems(
  conversationId: string,
  limit = 50,
): Promise<ApiMessage[]> {
  const data = await chatHttpService.get<{ data: ApiMessage[] }>(
    `/chat/info/${conversationId}/links`,
    { params: { limit } },
  );

  return data.data || [];
}


export async function fetchFriendRequests(): Promise<User[]> {
  try {
    const data = await chatHttpService.get<{ data: ApiUser[] }>("/friend-requests");
    // Nếu mảng rỗng thì trả về [] luôn, tránh lỗi map của undefined
    if (!data || !data.data) return [];
    return data.data.map(mapApiUserToUser);
  } catch (error) {
    console.error("Lỗi khi tải danh sách kết bạn:", error);
    return [];
  }
}

// Chấp nhận kết bạn (tạo luôn nhóm chat 1-1)
export async function acceptFriendRequest(requesterId: string): Promise<void> {
  await chatHttpService.post(`/friend-requests/accept`, { requesterId });
}

// Từ chối kết bạn
export async function rejectFriendRequest(requesterId: string): Promise<void> {
  await chatHttpService.post(`/friend-requests/reject`, { requesterId });
}

// Gửi lời mời kết bạn
export const sendFriendRequestApi = async (targetAccountId: string) => {
  const response = await chatHttpService.post('/friend-requests/send', {
    targetId: targetAccountId // (Nhớ là targetId để khớp với Backend nha)
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return response.data;
};

export const searchUsersApi = async (keyword: string = "") => {
  // Xử lý triệt để vụ lồng data (bắt mọi trường hợp)
  const response = await chatHttpService.get(
    `/users/search?keyword=${encodeURIComponent(keyword)}`
  ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  let userList = [];
  if (Array.isArray(response)) {
    userList = response;
  } else if (response?.data && Array.isArray(response.data)) {
    userList = response.data;
  } else if (response?.data?.data && Array.isArray(response.data.data)) {
    userList = response.data.data;
  }

  return { data: userList }; 
};

export async function joinGroupApi(
  conversationId: string,
): Promise<{
  conversation: Conversation;
  mode: "added" | "requested";
}> {
  const data = await chatHttpService.post<{
    data: { conversation: ApiConversation; mode: "added" | "requested" };
  }>(`/conversations/${conversationId}/join`, {});

  return {
    conversation: mapApiConversationToConversation(data.data.conversation, ""),
    mode: data.data.mode,
  };
}