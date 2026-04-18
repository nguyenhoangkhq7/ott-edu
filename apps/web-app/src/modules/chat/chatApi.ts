import { chatHttpService } from "@/services/api";
import {
  ApiConversation,
  ApiMessage,
  ApiUser,
  Attachment,
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
    myRole: apiConv.myRole || null,
    canManageGroup: apiConv.canManageGroup ?? apiConv.myRole === "owner",
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
 * POST /api/conversations/group
 * Tạo group chat mới, người tạo sẽ là owner.
 */
export async function createGroupConversation(payload: {
  name: string;
  participants: string[];
  avatarUrl?: string;
  metadata?: unknown;
}): Promise<Conversation> {
  const data = await chatHttpService.post<{ data: ApiConversation }>(
    "/conversations/group",
    payload,
  );

  return mapApiConversationToConversation(data.data, payload.participants[0] || "");
}

/**
 * GET /api/conversations/:conversationId/role
 * Lấy role của user hiện tại trong group chat.
 */
export async function fetchConversationRole(conversationId: string): Promise<{
  conversationId: string;
  ownerId: string | null;
  myRole: "owner" | "member" | null;
  canManageGroup: boolean;
}> {
  const data = await chatHttpService.get<{
    data: {
      conversationId: string;
      ownerId: string | null;
      myRole: "owner" | "member" | null;
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
 * POST /api/conversations/:conversationId/dissolve
 * Owner giải tán nhóm.
 */
export async function dissolveGroup(conversationId: string): Promise<void> {
  await chatHttpService.post(`/conversations/${conversationId}/dissolve`, {});
}
