import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import { API_URL } from "../api";
import { getAccessToken } from "../api/token-store";
import { refreshSession } from "../auth/auth.service";
import type {
  Assignment,
  AssignmentDetail,
  LocalAnswers,
  Submission,
  SubmissionResult,
} from "./assignment.types";

type ApiSuccessEnvelope<T> = {
  timestamp: string;
  status: number;
  message: string;
  data: T;
};

const DEFAULT_TIMEOUT_MS = 30000;
const ASSIGNMENT_BASE_URL = `${API_URL.replace(/\/$/, "")}/api/assignment`;
const BASE_PATH = "/assignments";

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

function unwrapEnvelope<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  if (!isApiSuccessEnvelope(response.data)) {
    return response;
  }

  return {
    ...response,
    data: response.data.data as T,
  };
}

function mapError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { message?: string; detail?: string; error?: string } | string | undefined;
    if (typeof payload === "string" && payload.length > 0) {
      return new Error(payload);
    }

    const message = payload?.message || payload?.detail || payload?.error;
    return new Error(message || "Không thể xử lý bài kiểm tra lúc này.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Không thể xử lý bài kiểm tra lúc này.");
}

async function attachAuthHeader(config: Parameters<AxiosInstance["interceptors"]["request"]["use"]>[0] extends (
  value: infer T,
) => any
  ? T
  : never) {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

const assignmentClient = axios.create({
  baseURL: ASSIGNMENT_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

assignmentClient.interceptors.request.use(async (config) => attachAuthHeader(config));
assignmentClient.interceptors.response.use(
  (response) => unwrapEnvelope(response),
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshSession();
      const nextAccessToken = refreshResponse.accessToken;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return assignmentClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export const assignmentApi = {
  getAssignments: async (teamId: number): Promise<Assignment[]> => {
    const response = await assignmentClient.get<Assignment[]>(`${BASE_PATH}/team/${teamId}`);
    return response.data;
  },

  getAssignmentDetail: async (assignmentId: number): Promise<AssignmentDetail> => {
    const response = await assignmentClient.get<AssignmentDetail>(`${BASE_PATH}/${assignmentId}`);
    return response.data;
  },

  startAssignment: async (assignmentId: number): Promise<Submission> => {
    const response = await assignmentClient.post<Submission>(`${BASE_PATH}/${assignmentId}/start`, {});
    return response.data;
  },

  getMySubmission: async (assignmentId: number): Promise<Submission | null> => {
    try {
      const response = await assignmentClient.get<Submission | null>(`${BASE_PATH}/${assignmentId}/my-submission`);
      return response.data;
    } catch {
      return null;
    }
  },

  saveAnswer: async (submissionId: number, questionId: number, selectedOptionIds: number[]): Promise<void> => {
    await assignmentClient.post<void>(`${BASE_PATH}/submission/${submissionId}/answer`, {
      questionId,
      selectedOptionIds,
    });
  },

  submitAssignment: async (submissionId: number): Promise<SubmissionResult> => {
    const response = await assignmentClient.post<SubmissionResult>(`${BASE_PATH}/submission/${submissionId}/submit`, {});
    return response.data;
  },
};

export { mapError };