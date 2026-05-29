// Thêm thành viên vào group chat (giống web)
export async function requestOrAddGroupMember(
  conversationId: string,
  payload: { email?: string; accountId?: string }
): Promise<{ conversation: Conversation; mode: 'added' | 'requested' }> {
  const { data } = await chatApiClient.post<{ data: { conversation: ApiConversation; mode: 'added' | 'requested' } }>(
    `conversations/${conversationId}/members`,
    payload
  );
  return {
    conversation: mapApiConversationToConversation(data.data.conversation, ''),
    mode: data.data.mode,
  };
}
import { chatApiClient } from './axiosClient';
import {
  ApiConversation,
  ApiMessage,
  ApiUser,
  Attachment,
  CallHistoryItem,
  Conversation,
  Message,
  User,
} from './types';

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser._id,
    _id: apiUser._id,
    // Fix lỗi: name sẽ lấy name (nếu có), không thì fullName, không thì "Người dùng"
    name: apiUser.name || apiUser.fullName || "Người dùng", 
    fullName: apiUser.fullName,
    email: apiUser.email,
    code: apiUser.code,
    role: apiUser.role || 'USER', // Gán default nếu không có role
    avatarUrl: apiUser.avatarUrl || `https://i.pravatar.cc/150?u=${apiUser._id}`,
    isOnline: !!apiUser.isOnline, // Ép về boolean chắc chắn
    friendStatus: apiUser.friendStatus || 'none'
  };
}
type ChatAuthIdentity = { email: string; code?: string };

export function mapApiMessageToMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg._id,
    conversationId: apiMsg.conversationId,
    senderId: apiMsg.senderId,
    content: apiMsg.content,
    createdAt: apiMsg.createdAt,
    status: 'sent',
    attachments: apiMsg.attachments || [],
    linkPreview: apiMsg.linkPreview,
    replyTo: apiMsg.replyTo ? mapApiMessageToMessage(apiMsg.replyTo) : null,
    isRevoked: apiMsg.isRevoked || false,
    revokedFor: apiMsg._hiddenForMe ? ['__self__'] : (apiMsg.revokedFor || []),
    isForwarded: apiMsg.isForwarded || false,
    reactions: apiMsg.reactions || [],
    type: apiMsg.type || 'text',
  };
}

export function mapApiConversationToConversation(
  apiConv: ApiConversation,
  currentUserId: string
): Conversation {
  const participants = apiConv.participants.map(mapApiUserToUser);
  const type = apiConv.type === 'group' ? 'class' : apiConv.type;
  let name: string | null = apiConv.name || null;
  if (type === 'private') {
    const other = participants.find((p) => p.id !== currentUserId);
    name = other?.name || null;
  }
  const lastMsg = apiConv.lastMessage ? mapApiMessageToMessage(apiConv.lastMessage) : null;
  return {
    id: apiConv._id,
    name,
    type,
    participants,
    lastMessage: lastMsg,
    unreadCount: 0,
    avatarUrl: apiConv.avatarUrl || (type === 'class' ? `https://i.pravatar.cc/150?img=30` : null),
    ownerId: apiConv.ownerId || null,
    deputyId: apiConv.deputyId || null,
    myRole: apiConv.myRole || null,
    canManageGroup: apiConv.canManageGroup ?? apiConv.myRole === 'owner',
    onlyAdminCanMessage: apiConv.onlyAdminCanMessage || false,
  };
}

export async function fetchConversations(currentUserId: string): Promise<Conversation[]> {
  const { data } = await chatApiClient.get<{ data: ApiConversation[] }>('conversations');
  return data.data.map((conv) => mapApiConversationToConversation(conv, currentUserId));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data } = await chatApiClient.get<{ data: ApiMessage[] }>(`messages/${conversationId}`);
  return data.data.map(mapApiMessageToMessage);
}

export async function sendMessage(
  content: string,
  receiverId?: string,
  conversationId?: string,
  attachments?: Attachment[],
  replyToMessageId?: string,
  isForwarded?: boolean
): Promise<Message> {
  const { data } = await chatApiClient.post<{ data: ApiMessage }>('messages', {
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
  const { data } = await chatApiClient.get<{
    data: CallHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    'calls/history',
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

export async function fetchConversationRole(conversationId: string): Promise<{
  conversationId: string;
  ownerId: string | null;
  myRole: 'owner' | 'member' | null;
  canManageGroup: boolean;
}> {
  const { data } = await chatApiClient.get<{ data: {
    conversationId: string;
    ownerId: string | null;
    myRole: 'owner' | 'member' | null;
    canManageGroup: boolean;
  } }>(`conversations/${conversationId}/role`);

  return data.data;
}

export async function removeGroupMember(conversationId: string, memberId: string): Promise<Conversation> {
  const { data } = await chatApiClient.post<{ data: ApiConversation }>(
    `conversations/${conversationId}/members/${memberId}/remove`,
  );
  return mapApiConversationToConversation(data.data, memberId);
}

export async function dissolveGroup(conversationId: string): Promise<void> {
  await chatApiClient.post(`conversations/${conversationId}/dissolve`, {});
}

export async function leaveGroup(conversationId: string, newOwnerId?: string): Promise<Conversation> {
  const { data } = await chatApiClient.post<{ data: ApiConversation }>(
    `conversations/${conversationId}/leave`,
    newOwnerId ? { newOwnerId } : {},
  );
  return mapApiConversationToConversation(data.data, '');
}

/**
 * Upload file qua chat-service backend (server đẩy lên S3).
 * Dùng multipart/form-data với React Native fetch.
 */
export async function uploadFileToChatService(
  fileUri: string,
  fileName: string,
  fileType: string
): Promise<{ fileUrl: string; s3Key: string }> {
  const formData = new FormData();
  // React Native: append dạng object với uri, name, type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData.append('file', { uri: fileUri, name: fileName, type: fileType } as any);

  const { data } = await chatApiClient.post<{ data: { fileUrl: string; s3Key: string } }>(
    'upload-file',
    formData,
    {
      params: { fileName, fileType },
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data.data;
}

// Sidebar / Info APIs (Kho ảnh, file, link)

export async function fetchConversationInfo(conversationId: string): Promise<ApiConversation> {
  const { data } = await chatApiClient.get<{ data: ApiConversation }>(`chat/info/${conversationId}`);
  return data.data;
}

export async function fetchMediaItems(conversationId: string, limit = 50): Promise<ApiMessage[]> {
  const { data } = await chatApiClient.get<{ data: ApiMessage[] }>(`chat/info/${conversationId}/media`, { params: { limit } });
  return data.data;
}

export async function fetchFileItems(conversationId: string, limit = 50): Promise<ApiMessage[]> {
  const { data } = await chatApiClient.get<{ data: ApiMessage[] }>(`chat/info/${conversationId}/files`, { params: { limit } });
  return data.data;
}

export async function fetchLinkItems(conversationId: string, limit = 50): Promise<ApiMessage[]> {
  const { data } = await chatApiClient.get<{ data: ApiMessage[] }>(`chat/info/${conversationId}/links`, { params: { limit } });
  return data.data;
}

// Cập nhật cài đặt cuộc trò chuyện (chỉ admin được gửi tin nhắn)
export async function updateConversationSettings(
  conversationId: string,
  settings: { onlyAdminCanMessage: boolean }
): Promise<Conversation> {
  const { data } = await chatApiClient.patch<{ data: ApiConversation }>(
    `conversations/${conversationId}/settings`,
    settings
  );
  return mapApiConversationToConversation(data.data, '');
}

export async function unfriendApi(targetId: string): Promise<void> {
  await chatApiClient.post('unfriend', { targetId });
}

// 🚀 Thêm searchUsersApi để đồng bộ với Web
export { searchUsers as searchUsersApi } from '../friends/friends.api';
