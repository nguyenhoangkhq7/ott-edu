import { axiosClient } from "./axios";
import type { ApiClient, ApiDeleteConfig, ApiRequestConfig } from "./types";

export const apiClient: ApiClient = {
  get: async <TResponse>(url: string, config?: ApiRequestConfig): Promise<TResponse> => {
    const response = await axiosClient.get<TResponse>(url, config);
    return response.data;
  },

  post: async <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosClient.post<TResponse>(url, body, config);
    return response.data;
  },

  update: async <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosClient.put<TResponse>(url, body, config);
    return response.data;
  },

  patch: async <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosClient.patch<TResponse>(url, body, config);
    return response.data;
  },

  delete: async <TResponse>(url: string, config?: ApiDeleteConfig): Promise<TResponse> => {
    const response = await axiosClient.delete<TResponse>(url, config);
    return response.data;
  },
};
