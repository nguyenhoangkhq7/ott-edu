import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./api";
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./token-store";
import { emitSessionExpired } from "../auth/session-events";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type ApiSuccessEnvelope<T> = {
  timestamp: string;
  status: number;
  message: string;
  data: T;
};

function getBaseUrl(): string {
  return `${API_URL.replace(/\/$/, "")}/api/core`;
}

export const axiosClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

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

function unwrapEnvelope<T>(payload: T | ApiSuccessEnvelope<T>): T {
  if (isApiSuccessEnvelope(payload)) {
    return payload.data as T;
  }

  return payload as T;
}

axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    response.data = unwrapEnvelope(response.data);
    return response;
  },
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
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error("Missing refresh token.");
      }

      const refreshResponse = await refreshClient.post<RefreshResponse>("/auth/refresh", {
        refreshToken,
      });

      const refreshData = unwrapEnvelope(refreshResponse.data);

      await setAccessToken(refreshData.accessToken);
      await setRefreshToken(refreshData.refreshToken);

      originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      await clearAllTokens();
      emitSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosClient;
