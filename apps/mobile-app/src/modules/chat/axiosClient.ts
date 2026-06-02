import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_URL, getAccessToken } from '../api';

// Gateway proxies /api/chat/* to chat-service /api/*.
// Example: API_URL/api/chat/me -> chat-service /api/me
const CHAT_SERVICE_API_URL = `${API_URL.replace(/\/$/, "")}/api/chat/`;

export interface ChatHeaderConfig {
  email: string;
  code?: string;
  fullName?: string;
  avatarUrl?: string;
}

let currentChatConfig: ChatHeaderConfig | null = null;

export function setSharedChatConfig(config: ChatHeaderConfig | null) {
  currentChatConfig = config;
}

export function getSharedChatConfig(): ChatHeaderConfig | null {
  return currentChatConfig;
}

export const chatApiClient = axios.create({
  baseURL: CHAT_SERVICE_API_URL,
  timeout: 10000,
});

chatApiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (currentChatConfig) {
    config.headers["x-user-email"] = currentChatConfig.email || "";
    config.headers["x-user-code"] = currentChatConfig.code || "";
    if (currentChatConfig.fullName) {
      config.headers["x-user-name"] = encodeURIComponent(currentChatConfig.fullName);
    }
    if (currentChatConfig.avatarUrl) {
      config.headers["x-user-avatar"] = currentChatConfig.avatarUrl;
    } else {
      delete config.headers["x-user-avatar"];
    }
  }

  return config;
});

chatApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[ChatAPI Error]', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);
