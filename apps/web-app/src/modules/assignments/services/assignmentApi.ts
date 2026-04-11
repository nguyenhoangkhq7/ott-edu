import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken } from "@/services/api/token-store";

/**
 * Assignment API Client
 * 
 * Handles all HTTP requests to Assignment Service via Gateway
 * Base URL: http://localhost:8000/api/assignments
 * 
 * Features:
 * - Automatic JWT token injection in Authorization header
 * - Token refresh on 401 errors
 * - Error mapping to user-friendly messages
 */

const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ASSIGNMENT_API_BASE = `${GATEWAY_BASE_URL}/api/assignments`;

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ============ AXIOS INSTANCE ============

const assignmentApiClient = axios.create({
  baseURL: ASSIGNMENT_API_BASE,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Inject JWT Token
assignmentApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 and refresh token
const refreshClient = axios.create({
  baseURL: `${GATEWAY_BASE_URL}/api/core`,
  timeout: 30000,
  withCredentials: true,
});

assignmentApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshClient.post<{ accessToken: string }>(
        "/auth/refresh",
        {}
      );
      const nextAccessToken = refreshResponse.data.accessToken;

      if (!nextAccessToken) {
        throw new Error("Missing access token after refresh.");
      }

      setAccessToken(nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return assignmentApiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

// ============ ERROR HANDLING ============

export class AssignmentApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AssignmentApiError";
  }
}

function mapApiError(error: unknown): AssignmentApiError {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status || 500;
    const message =
      typeof error.response?.data === "string"
        ? error.response.data
        : (error.response?.data as any)?.message ||
          error.message ||
          "Không thể xử lý yêu cầu lúc này.";

    const code = error.code || "UNKNOWN_ERROR";
    return new AssignmentApiError(code, statusCode, message);
  }

  if (error instanceof Error) {
    return new AssignmentApiError("ERROR", 500, error.message);
  }

  return new AssignmentApiError("UNKNOWN", 500, "Không thể xử lý yêu cầu lúc này.");
}

// ============ API FUNCTIONS ============

/**
 * Create a new assignment
 * POST /api/assignments
 */
export async function createAssignment(data: any): Promise<any> {
  try {
    const response = await assignmentApiClient.post("/", data);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get all assignments for a team
 * GET /api/assignments/teams/{teamId}
 */
export async function getAssignmentsByTeam(teamId: number): Promise<any[]> {
  try {
    const response = await assignmentApiClient.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get a single assignment by id
 * GET /api/assignments/{id}
 */
export async function getAssignmentById(id: number): Promise<any> {
  try {
    const response = await assignmentApiClient.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Update an assignment
 * PUT /api/assignments/{id}
 */
export async function updateAssignment(id: number, data: any): Promise<any> {
  try {
    const response = await assignmentApiClient.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Delete an assignment
 * DELETE /api/assignments/{id}
 */
export async function deleteAssignment(id: number): Promise<void> {
  try {
    await assignmentApiClient.delete(`/${id}`);
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get all submissions for an assignment
 * GET /api/assignments/{assignmentId}/submissions
 */
export async function getSubmissions(assignmentId: number): Promise<any[]> {
  try {
    const response = await assignmentApiClient.get(`/${assignmentId}/submissions`);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get a student's submission for an assignment
 * GET /api/assignments/{assignmentId}/submissions/{studentId}
 */
export async function getStudentSubmission(
  assignmentId: number,
  studentId: number
): Promise<any> {
  try {
    const response = await assignmentApiClient.get(
      `/${assignmentId}/submissions/${studentId}`
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Submit an assignment
 * POST /api/assignments/{assignmentId}/submissions
 */
export async function submitAssignment(assignmentId: number, data: any): Promise<any> {
  try {
    const response = await assignmentApiClient.post(
      `/${assignmentId}/submissions`,
      data
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Grade a submission
 * POST /api/assignments/{assignmentId}/submissions/{submissionId}/grade
 */
export async function gradeSubmission(
  assignmentId: number,
  submissionId: number,
  data: { grade: number; feedback?: string }
): Promise<any> {
  try {
    const response = await assignmentApiClient.post(
      `/${assignmentId}/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Upload Material file
 * POST /api/assignments/materials/upload
 * Returns Material object with id, name, url, type
 */
export async function uploadMaterial(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await assignmentApiClient.post("/materials/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export default assignmentApiClient;
