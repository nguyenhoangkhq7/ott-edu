import {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  ResponseType,
} from "axios";

import apiClient from "./axios";
import { chatApiClient } from "./chat-axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
};

export type HttpRequestOptions = {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  responseType?: ResponseType;
};

function toAxiosConfig(options?: HttpRequestOptions): AxiosRequestConfig {
  return {
    params: options?.params,
    headers: options?.headers,
    responseType: options?.responseType,
  };
}

function mapApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const rawData = error.response?.data;
    let message: string | undefined;

    if (typeof rawData === "string") {
      // Nếu server trả về HTML (Express 404/500), không hiển thị raw HTML
      if (rawData.trim().startsWith("<")) {
        message = undefined;
      } else {
        message = rawData;
      }
    } else {
      message =
        (rawData as ApiErrorPayload | undefined)?.message ||
        (rawData as ApiErrorPayload | undefined)?.detail ||
        (rawData as ApiErrorPayload | undefined)?.error;
    }

    return new Error(message || "Không thể xử lý yêu cầu lúc này.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Không thể xử lý yêu cầu lúc này.");
}

class HttpService {
  private client: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.client = axiosInstance;
  }

  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    try {
      const response = await this.client.get<T>(url, toAxiosConfig(options));
      return response.data;
    } catch (error) {
      throw mapApiError(error);
    }
  }

  async post<T>(
    url: string,
    payload?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(
        url,
        payload,
        toAxiosConfig(options),
      );
      return response.data;
    } catch (error) {
      throw mapApiError(error);
    }
  }

  async put<T>(
    url: string,
    payload?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.put<T>(
        url,
        payload,
        toAxiosConfig(options),
      );
      return response.data;
    } catch (error) {
      throw mapApiError(error);
    }
  }

  async update<T>(
    url: string,
    payload?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    return this.put<T>(url, payload, options);
  }

  async patch<T>(
    url: string,
    payload?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.patch<T>(
        url,
        payload,
        toAxiosConfig(options),
      );
      return response.data;
    } catch (error) {
      throw mapApiError(error);
    }
  }

  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, toAxiosConfig(options));
      return response.data;
    } catch (error) {
      throw mapApiError(error);
    }
  }
}

export const httpService = new HttpService(apiClient);
export const chatHttpService = new HttpService(chatApiClient);
