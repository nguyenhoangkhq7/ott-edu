import { chatApiClient } from './axiosClient';
import {
  ApiConversation,
  ApiMessage,
  ApiUser,
  Attachment,
  Conversation,
  Message,
  User,
} from './types';

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser._id,
    name: apiUser.fullName,
    email: apiUser.email,
    code: apiUser.code,
    avatarUrl: apiUser.avatarUrl || `https://i.pravatar.cc/150?u=${apiUser._id}`,
    isOnline: false,
  };
}

export type ChatAuthIdentity = { email: string; code?: string };

export function mapApiMessageToMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg._id,
    conversationId: apiMsg.conversationId,
    senderId: apiMsg.senderId,
    content: apiMsg.content,
    createdAt: apiMsg.createdAt,
    status: 'sent',
    attachments: apiMsg.attachments || [],
    replyTo: apiMsg.replyTo ? mapApiMessageToMessage(apiMsg.replyTo) : null,
    isRevoked: apiMsg.isRevoked || false,
    reactions: apiMsg.reactions || [],
  };
}

export function mapApiConversationToConversation(
  apiConv: ApiConversation,
  currentUserId: string
): Conversation {
  const participants = apiConv.participants.map(mapApiUserToUser);
  const type = apiConv.type;
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
  };
}

export async function fetchConversations(currentUserId: string): Promise<Conversation[]> {
  const { data } = await chatApiClient.get<{ data: ApiConversation[] }>('/conversations');
  return data.data.map((conv) => mapApiConversationToConversation(conv, currentUserId));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data } = await chatApiClient.get<{ data: ApiMessage[] }>(`/messages/${conversationId}`);
  return data.data.map(mapApiMessageToMessage);
}

export async function sendMessage(
  content: string,
  receiverId?: string,
  conversationId?: string,
  attachments?: Attachment[],
  replyToMessageId?: string
): Promise<Message> {
  const { data } = await chatApiClient.post<{ data: ApiMessage }>('/messages', {
    receiverId,
    conversationId,
    content,
    attachments,
    replyTo: replyToMessageId,
  });
  return mapApiMessageToMessage(data.data);
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
    '/upload-file',
    formData,
    {
      params: { fileName, fileType },
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data.data;
}
