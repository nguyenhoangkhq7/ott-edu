import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_URL, getAccessToken } from '../api';

// Gateway proxies /api/chat/* to chat-service /api/*.
// Example: API_URL/api/chat/me -> chat-service /api/me
const CHAT_SERVICE_API_URL = `${API_URL.replace(/\/$/, "")}/api/chat`;

export const chatApiClient = axios.create({
  baseURL: CHAT_SERVICE_API_URL,
  timeout: 10000,
});

chatApiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

chatApiClient.interceptors.response.use(
  (response) => {
    // Nếu API bọc { data: ... } thì bóc tách nếu cần, hoặc mặc định chatApi.ts đã xử lý `data.data`
    return response;
  },
  (error) => {
    console.error('[ChatAPI Error]', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);
