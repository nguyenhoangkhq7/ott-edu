import { chatApiClient } from "./axiosClient";
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
    avatarUrl:
      apiUser.avatarUrl || `https://i.pravatar.cc/150?u=${apiUser._id}`,
    isOnline: false, // Backend chưa cung cấp trạng thái online; có thể cập nhật qua Socket
  };
}

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
  const response = await chatApiClient.get<{ data: ApiConversation[] }>(
    "/conversations",
  );
  return response.data.data.map((conv) =>
    mapApiConversationToConversation(conv, currentUserId),
  );
}

/**
 * GET /api/messages/:conversationId
 * Lấy toàn bộ lịch sử tin nhắn của một cuộc trò chuyện.
 */
export async function fetchMessages(
  conversationId: string,
): Promise<Message[]> {
  const response = await chatApiClient.get<{ data: ApiMessage[] }>(
    `/messages/${conversationId}`,
  );
  return response.data.data.map(mapApiMessageToMessage);
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
  const response = await chatApiClient.get<{ data: any }>("/upload-url", {
    params: { fileName, fileType },
  });
  return response.data.data;
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
 * POST /api/messages
 * Gửi tin nhắn mới tới người nhận HOẶC nhóm với hỗ trợ attachments và replies
 */
export async function sendMessage(
  content: string,
  receiverId?: string,
  conversationId?: string,
  attachments?: Attachment[],
  replyToMessageId?: string,
): Promise<Message> {
  const response = await chatApiClient.post<{ data: ApiMessage }>("/messages", {
    receiverId,
    conversationId,
    content,
    attachments,
    replyTo: replyToMessageId,
  });
  return mapApiMessageToMessage(response.data.data);
}
