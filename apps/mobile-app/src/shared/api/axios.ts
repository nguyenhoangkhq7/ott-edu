import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./api";
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./token-store";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

function getBaseUrl(): string {
  return `${API_URL.replace(/\/$/, "")}/api/core`;
}

const axiosClient = axios.create({
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

axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
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

      await setAccessToken(refreshResponse.data.accessToken);
      await setRefreshToken(refreshResponse.data.refreshToken);

      originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      await clearAllTokens();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosClient;
