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

const DEFAULT_API_BASE_URL = "/api/core";
const DEFAULT_TIMEOUT_MS = 30000;

function getApiBaseUrl() { return DEFAULT_API_BASE_URL; }

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

// ==========================================
// THÊM LOGIC QUEUE (HÀNG ĐỢI) XỬ LÝ REFRESH
// ==========================================
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

    // Nếu không phải lỗi 401 hoặc request này đã được retry rồi thì bỏ qua
    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // NẾU ĐANG TRONG QUÁ TRÌNH REFRESH -> CHO CÁC REQUEST KHÁC XẾP HÀNG
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // ĐÁNH DẤU BẮT ĐẦU REFRESH
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await refreshClient.post<RefreshResponse>("/auth/refresh", {});
      const nextAccessToken = refreshResponse.data.accessToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token after refresh.");
      }

      // Lưu Token mới
      setAccessToken(nextAccessToken);
      
      // Gắn token mới vào request đang bị lỗi
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      // BÁO CHO CÁC REQUEST ĐANG XẾP HÀNG BIẾT LÀ ĐÃ CÓ TOKEN MỚI
      processQueue(null, nextAccessToken);

      // Chạy lại request hiện tại
      return apiClient(originalRequest);
    } catch (refreshError) {
      // NẾU REFRESH LỖI -> HỦY TOÀN BỘ HÀNG ĐỢI VÀ ĐĂNG XUẤT
      processQueue(refreshError as AxiosError, null);
      clearAccessToken();
      emitSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      // KẾT THÚC QUÁ TRÌNH REFRESH
      isRefreshing = false;
    }
  }
);

export default apiClient;