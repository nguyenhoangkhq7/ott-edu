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

// ─── Data Transformers (API → UI) ───────────────────────────────────────────

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

// ─── API Functions ───────────────────────────────────────────────────────────

export async function fetchConversations(currentUserId: string): Promise<Conversation[]> {
  const { data } = await chatApiClient.get<{ data: ApiConversation[] }>('/conversations');
  return data.data.map((conv) => mapApiConversationToConversation(conv, currentUserId));
}

export async function fetchCurrentChatUser(identity: ChatAuthIdentity): Promise<User> {
  const { data } = await chatApiClient.get<{ data: ApiUser }>('/me', {
    headers: {
      'x-user-email': identity.email,
      'x-user-code': identity.code || '',
    },
  });
  return mapApiUserToUser(data.data);
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data } = await chatApiClient.get<{ data: ApiMessage[] }>(`/messages/${conversationId}`);
  return data.data.map(mapApiMessageToMessage);
}

// Upload file directly to S3 via presigned URL (skipped File usage as React Native uses uri and type differently for fetch, but keep logic if we use form data or blob)
export async function getPresignedUrl(
  fileName: string,
  fileType: string
): Promise<{ presignedUrl: string; fileUrl: string; s3Key: string; expiresIn: number }> {
  const { data } = await chatApiClient.get<{
    data: { presignedUrl: string; fileUrl: string; s3Key: string; expiresIn: number };
  }>('/upload-url', {
    params: { fileName, fileType },
  });
  return data.data;
}

export async function uploadToS3(presignedUrl: string, fileUri: string, fileType: string): Promise<void> {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType,
      },
      body: blob,
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
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
