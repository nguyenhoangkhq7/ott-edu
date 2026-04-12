import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/services/api/token-store";
import type { Assignment, StudentSubmission } from "@/modules/assignments/types";

/**
 * Assignment API Service
 * 
 * Handles all HTTP requests to Assignment Service via Gateway
 * Base URL: http://localhost:8000/api/assignments
 * 
 * Features:
 * - Automatic JWT token injection in Authorization header
 * - Error mapping to user-friendly messages
 * - Type-safe API responses
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
  // For development: Use Basic Auth (teacher/teacher123)
  const credentials = btoa('teacher:teacher123');
  config.headers.Authorization = `Basic ${credentials}`;

  const token = getAccessToken();
  if (token) {
    // If token exists, use Bearer token instead
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token được inject: Bearer token');
  } else {
    console.log('ℹ️  Không có token, dùng Basic Auth (teacher/teacher123)');
  }
  return config;
});

// Response interceptor: Handle 401
assignmentApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
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

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;

    // Handle specific status codes
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token không hợp lệ hoặc đã hết hạn');
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden - Không có quyền truy cập');
      return "Bạn không có quyền truy cập tài nguyên này.";
    }
    if (error.response?.status === 400) {
      console.error('❌ 400 Bad Request - Dữ liệu yêu cầu không hợp lệ');
      console.error('Response data:', data);
      const message = data?.message;
      return typeof message === "string" ? message : "Yêu cầu không hợp lệ.";
    }

    console.error(`❌ HTTP ${error.response?.status} - ${error.message}`);
    const message = data?.message;
    return typeof message === "string" ? message : error.message || "Không thể xử lý yêu cầu lúc này.";
  }

  if (error instanceof Error) {
    console.error('❌ Error:', error.message);
    return error.message;
  }

  console.error('❌ Unknown error:', error);
  return "Không thể xử lý yêu cầu lúc này.";
}

function mapApiError(error: unknown): AssignmentApiError {
  const statusCode = error instanceof AxiosError ? error.response?.status || 500 : 500;
  const code = error instanceof AxiosError ? error.code || "UNKNOWN_ERROR" : "ERROR";
  const message = getErrorMessage(error);

  return new AssignmentApiError(code, statusCode, message);
}

// ============ DTO/REQUEST INTERFACES ============

export interface CreateAssignmentPayload {
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string; // ISO 8601 format
  type: "ESSAY" | "QUIZ";
  teamId: number;
  materialIds?: number[];
  questions?: Array<{
    content: string;
    answerOptions: Array<{
      content: string;
      isCorrect: boolean;
    }>;
  }>;
}

export interface PublishAssignmentResponse {
  assignmentId: number;
  title: string;
  publishedAt: string;
  teamId: number;
  submissionsCreated: number;
  message: string;
}

export interface GradeSubmissionPayload {
  score: number; // Must be a number
  feedback?: string;
}

export interface StudentResultResponse {
  assignmentId: number;
  assignmentTitle: string;
  assignmentType: string;
  submissionStatus: string;
  maxScore?: number;
  score?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  submissionContent?: string;
  message?: string;
  incorrectAnswers?: Array<{
    questionId: number;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
  }>;
}

// ============ API FUNCTIONS ============

/**
 * Create a new assignment (Teacher)
 * POST /api/assignments
 */
export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<Assignment> {
  console.log('📤 Payload gửi lên backend:', JSON.stringify(payload, null, 2));
  try {
    const response = await assignmentApiClient.post("", payload);

    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Publish/Deliver an assignment to students (Teacher)
 * PATCH /api/assignments/{id}/publish
 */
export async function publishAssignment(
  assignmentId: number
): Promise<PublishAssignmentResponse> {
  try {
    const response = await assignmentApiClient.patch(`/${assignmentId}/publish`, {});
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get student's assignment result (Student)
 * GET /api/assignments/{assignmentId}/my-result
 */
export async function getStudentResult(
  assignmentId: number
): Promise<StudentResultResponse> {
  try {
    const response = await assignmentApiClient.get(
      `/${assignmentId}/my-result`
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Grade a submission (Teacher)
 * POST /api/core/submissions/{submissionId}/grade
 * Note: This uses /api/core/submissions endpoint
 */
export async function gradeSubmission(
  submissionId: number,
  payload: GradeSubmissionPayload
): Promise<StudentResultResponse> {
  try {
    // Use the core submissions endpoint
    const coreApiClient = axios.create({
      baseURL: `${GATEWAY_BASE_URL}/api/core`,
      timeout: 30000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Inject auth (Basic Auth for development)
    coreApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const credentials = btoa('teacher:teacher123');
      config.headers.Authorization = `Basic ${credentials}`;

      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const response = await coreApiClient.post(
      `/submissions/${submissionId}/grade`,
      {
        score: Number(payload.score), // Ensure it's a number
        feedback: payload.feedback || null,
      }
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get all submissions for an assignment (Teacher)
 * GET /api/assignments/{assignmentId}/submissions
 */
export async function getSubmissions(
  assignmentId: number
): Promise<StudentSubmission[]> {
  try {
    const response = await assignmentApiClient.get(
      `/${assignmentId}/submissions`
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get all assignments in the system
 * GET /api/assignments
 */
export async function getAllAssignments(): Promise<Assignment[]> {
  try {
    const response = await assignmentApiClient.get("");
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get all assignments by fetching each individually using getAssignmentById
 * Useful for testing or when you need fresh data for each assignment
 * @param assignmentIds - Array of assignment IDs to fetch
 */
export async function getAllAssignmentsByIdFetch(assignmentIds: number[]): Promise<Assignment[]> {
  try {
    const results = await Promise.all(
      assignmentIds.map((id) => getAssignmentById(id))
    );
    return results;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get a single assignment by ID
 * GET /api/assignments/{id}
 */
export async function getAssignmentById(id: number): Promise<Assignment> {
  try {
    const response = await assignmentApiClient.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Get all assignments for a team
 * GET /api/assignments/teams/{teamId}
 */
export async function getAssignmentsByTeam(teamId: number): Promise<Assignment[]> {
  try {
    const response = await assignmentApiClient.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * Upload material/attachment
 * POST /api/core/materials
 * (Placeholder for future implementation)
 */
export async function uploadMaterial(file: File): Promise<{ id: number; name: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const credentials = btoa('teacher:teacher123');
    const response = await axios.post(
      `${GATEWAY_BASE_URL}/api/core/materials`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Format ISO 8601 datetime to display string
 * Input: "2025-12-15T23:59:00"
 * Output: "15/12/2025 23:59"
 */
export function formatDateTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return isoDate;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

/**
 * Format ISO 8601 date to display string
 * Input: "2025-12-15T23:59:00"
 * Output: "15/12/2025"
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return isoDate;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Convert HTML datetime-local to ISO 8601
 * Input: "2025-12-15T23:59" (from HTML input datetime-local)
 * Output: "2025-12-15T23:59:00"
 */
export function convertToISO8601(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";
  return `${dateTimeLocal}:00`;
}
