import axios from "axios";
import { getAccessToken } from "./token-store";

const CHAT_SERVICE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3001";

export const chatApiClient = axios.create({
  baseURL: `${CHAT_SERVICE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Đính kèm Authorization nếu đã đăng nhập qua AuthProvider
chatApiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default chatApiClient;
