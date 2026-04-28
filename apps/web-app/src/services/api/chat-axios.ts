import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken } from "./token-store";
import { clearAccessToken, setAccessToken } from "./token-store";

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

const refreshClient = axios.create({
  baseURL: "/api/core",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshClient.post<RefreshResponse>(
        "/auth/refresh",
        {},
      );
      const nextAccessToken = refreshResponse.data.accessToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token after refresh.");
      }

      setAccessToken(nextAccessToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return chatApiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      return Promise.reject(refreshError);
    }
  },
);

export default chatApiClient;
