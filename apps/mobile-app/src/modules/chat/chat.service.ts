import axios from "axios";
import { CHAT_API_URL } from "./chat.config";
import {
  ApiConversation,
  ApiUser,
  ChatAuthIdentity,
  ChatConversation,
  ChatUser,
} from "./types";

const chatClient = axios.create({
  baseURL: CHAT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

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

  return "Khong the ket noi den chat service.";
}

function createIdentityHeaders(identity: ChatAuthIdentity): Record<string, string> {
  return {
    "x-user-email": identity.email,
    "x-user-code": identity.code || "",
  };
}

function mapApiUserToChatUser(apiUser: ApiUser): ChatUser {
  return {
    id: apiUser._id,
    name: apiUser.fullName,
    email: apiUser.email,
    code: apiUser.code,
    avatarUrl: apiUser.avatarUrl,
  };
}

function mapApiConversationToChatConversation(
  apiConversation: ApiConversation,
  currentUserId: string,
): ChatConversation {
  const participants = apiConversation.participants.map(mapApiUserToChatUser);

  const name =
    apiConversation.type === "private"
      ? participants.find((participant) => participant.id !== currentUserId)?.name || "Private Chat"
      : apiConversation.name || "Group Chat";

  return {
    id: apiConversation._id,
    type: apiConversation.type,
    name,
    participants,
    avatarUrl: apiConversation.avatarUrl,
  };
}

export async function fetchCurrentChatUser(identity: ChatAuthIdentity): Promise<ChatUser> {
  try {
    const response = await chatClient.get<{ data: ApiUser }>("/me", {
      headers: createIdentityHeaders(identity),
    });

    return mapApiUserToChatUser(response.data.data);
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function fetchConversations(
  currentUserId: string,
  identity: ChatAuthIdentity,
): Promise<ChatConversation[]> {
  try {
    const response = await chatClient.get<{ data: ApiConversation[] }>("/conversations", {
      headers: createIdentityHeaders(identity),
    });

    return response.data.data.map((conversation) =>
      mapApiConversationToChatConversation(conversation, currentUserId),
    );
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}
