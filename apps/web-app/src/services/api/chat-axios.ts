import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  clearAccessToken,
  setAccessToken,
  getRefreshToken,
  updateActiveSessionToken
} from "./token-store";
import { emitSessionExpired } from "@/services/auth/session-events";

function resolveChatApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL?.trim();

  if (!configuredUrl) {
    // Route through gateway by default to avoid mixed-content/CORS issues.
    return "/api/chat";
  }

  const normalizedUrl = configuredUrl.replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(normalizedUrl)) {
    return normalizedUrl;
  }

  if (normalizedUrl.endsWith("/api")) {
    return normalizedUrl;
  }

  return `${normalizedUrl}/api`;
}

const CHAT_API_BASE_URL = resolveChatApiBaseUrl();

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const chatApiClient = axios.create({
  baseURL: CHAT_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// QUEUE LOGIC FOR CHAT SERVICE TOKEN REFRESH
// ==========================================
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor: Đính kèm Authorization nếu đã đăng nhập qua AuthProvider
chatApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

chatApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return chatApiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No active refresh token available in sessionStorage.");
      }

      const response = await fetch("/api/core/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh session via native fetch");
      }

      const json = await response.json();
      const nextAccessToken = json.data.accessToken;
      const nextRefreshToken = json.data.refreshToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token after refresh.");
      }

      updateActiveSessionToken(nextAccessToken, nextRefreshToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      processQueue(null, nextAccessToken);

      return chatApiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      clearAccessToken();
      emitSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default chatApiClient;
