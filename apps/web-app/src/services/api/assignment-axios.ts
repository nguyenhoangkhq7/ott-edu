import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/services/api/token-store";
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

const DEFAULT_TIMEOUT_MS = 30000;

function getApiTimeout(): number {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

// Assignment service uses /api/assignment/ base (NO baseURL = use absolute paths)
const baseConfig = {
  timeout: getApiTimeout(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

const assignmentClient = axios.create(baseConfig);
const refreshClient = axios.create(baseConfig);

function isApiSuccessEnvelope(payload: unknown): payload is ApiSuccessEnvelope<unknown> {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.status === "number" &&
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

// Queue for refresh handling
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

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

// Request interceptor - add auth token
assignmentClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

refreshClient.interceptors.response.use((response) => unwrapApiSuccessEnvelope(response));

// Response interceptor - handle 401 and refresh
assignmentClient.interceptors.response.use(
  (response) => unwrapApiSuccessEnvelope(response),
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    if (requestUrl.includes("/auth/")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return assignmentClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await refreshClient.post<RefreshResponse>("/api/core/auth/refresh", {});
      const nextAccessToken = refreshResponse.data.accessToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token after refresh.");
      }

      setAccessToken(nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      processQueue(null, nextAccessToken);

      return assignmentClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      clearAccessToken();
      emitSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default assignmentClient;
