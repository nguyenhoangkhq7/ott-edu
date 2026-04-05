import axios from "axios";

const CHAT_SERVICE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3001";

export const chatApiClient = axios.create({
  baseURL: `${CHAT_SERVICE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Đính kèm x-user-id header vào mọi request (giả lập auth cho dev)
chatApiClient.interceptors.request.use((config) => {
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("dev_user_id") : null;
  if (userId) {
    config.headers["x-user-id"] = userId;
  }
  return config;
});
