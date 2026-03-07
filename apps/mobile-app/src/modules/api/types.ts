import type { AxiosRequestConfig } from "axios";

export type ApiRequestConfig = AxiosRequestConfig;

export type ApiDeleteConfig = ApiRequestConfig;

export type ApiClient = {
  get: <TResponse>(url: string, config?: ApiRequestConfig) => Promise<TResponse>;
  post: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ) => Promise<TResponse>;
  update: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ) => Promise<TResponse>;
  patch: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: ApiRequestConfig,
  ) => Promise<TResponse>;
  delete: <TResponse>(url: string, config?: ApiDeleteConfig) => Promise<TResponse>;
};
