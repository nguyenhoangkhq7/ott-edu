import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { clearAccessToken, getAccessToken, setAccessToken } from "@/services/api/token-store";
import { emitSessionExpired } from "@/services/auth/session-events";

type RefreshResponse = {
  accessToken: string;
};

type ApiSuccessEnvelope<T> = {
  timestamp: string;
  status: number;
  message: string;
  data: T;
};

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30000;

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const value = raw && raw.length > 0 ? raw : DEFAULT_API_BASE_URL;
  return value.replace(/\/$/, "");
}

function getApiTimeout(): number {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

const baseConfig = {
  baseURL: getApiBaseUrl(),
  timeout: getApiTimeout(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

const apiClient = axios.create(baseConfig);
const refreshClient = axios.create(baseConfig);

function isApiSuccessEnvelope(payload: unknown): payload is ApiSuccessEnvelope<unknown> {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<ApiSuccessEnvelope<unknown>>;

  return (
    typeof candidate.timestamp === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.message === "string" &&
    "data" in candidate
  );
}

function unwrapApiSuccessEnvelope<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  if (!isApiSuccessEnvelope(response.data)) {
    return response;
  }

  return {
    ...response,
    data: response.data.data as T,
  };
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

refreshClient.interceptors.response.use((response) => unwrapApiSuccessEnvelope(response));

apiClient.interceptors.response.use(
  (response) => unwrapApiSuccessEnvelope(response),
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshClient.post<RefreshResponse>("/auth/refresh", {});
      const nextAccessToken = refreshResponse.data.accessToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token after refresh.");
      }

      setAccessToken(nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      emitSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
