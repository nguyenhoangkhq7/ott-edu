/**
 * assignmentApi — Axios client for the Assignment microservice.
 *
 * Backend endpoints verified from controllers:
 *
 * AssignmentController  → @RequestMapping("/api/v1/assignments")
 *   GET  /team/{teamId}                        → getAssignmentsByTeam  (STUDENT + TEACHER)
 *   GET  /{assignmentId}                       → getAssignmentDetail   (STUDENT + TEACHER)
 *   POST /create                               → createAssignment      (TEACHER only)
 *   PUT  /{assignmentId}                       → updateAssignment      (TEACHER only)
 *   DELETE /{assignmentId}/archive             → archiveAssignment     (TEACHER only)
 *   GET  /my-assignments                       → getMyAssignments      (TEACHER only)
 *
 * SubmissionController  → @RequestMapping("/api/v1/submissions")
 *   POST /assignment/{assignmentId}/start      → startAssignment       (STUDENT only)
 *   GET  /assignment/{assignmentId}/current    → getCurrentSubmission  (STUDENT only)
 *   POST /{submissionId}/save-draft            → saveDraft             (STUDENT only)
 *   POST /assignment/{assignmentId}/submit     → submitAssignment      (STUDENT only)
 *     body: { questionAnswers?, essayContent?, fileUrl?, confirm: true }
 *   GET  /{submissionId}                       → getMySubmission       (STUDENT only)
 *   GET  /{submissionId}/grade                 → getMyGrade            (STUDENT only)
 *   GET  /my-submissions                       → getMySubmissions      (STUDENT only)
 *   GET  /attempt-history/{assignmentId}       → getAttemptHistory     (STUDENT only)
 *   GET  /can-attempt/{assignmentId}           → canAttempt            (STUDENT only)
 *   GET  /assignment/{assignmentId}/pending    → getPendingGrading     (TEACHER only)
 *   GET  /assignment/{assignmentId}            → getAllSubmissions      (TEACHER only)
 *   POST /{submissionId}/grade                 → gradeSubmission       (TEACHER only)
 *     body: { score: number, feedback?: string }
 *
 * QuizController  → @RequestMapping("/api/v1/quiz")  [legacy — prefer SubmissionController]
 *   POST /submission/{submissionId}/answer     → saveAnswer (single answer)
 *   POST /submission/{submissionId}/submit     → submitAndGrade (returns SubmissionResultDto)
 *
 * Gateway routing (nginx.conf):
 *   /api/v1/  →  proxy_pass http://assignment-service:8080/ (keeps full path)
 *
 * Therefore: ASSIGNMENT_SERVICE_URL = {GATEWAY}/api/v1
 */

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { API_URL } from "../api";
import { getAccessToken } from "../api/token-store";
import { refreshSession } from "../auth/auth.service";
import type {
  Assignment,
  AssignmentDetail,
  AssignmentTeacherView,
  CreateAssignmentPayload,
  GradeDetails,
  GradeSubmissionPayload,
  PageResponse,
  SubmissionGradingItem,
} from "./assignment.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiSuccessEnvelope<T> = {
  timestamp: string;
  status: number;
  message: string;
  data: T;
};

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

/** Matches ViewSubmissionDto.java */
export type ViewSubmission = {
  id: number;
  submissionId: number;
  assignmentId: number;
  accountId: number;
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  createdAt: string;
  submittedAt: string | null;
  isLate: boolean;
  fileUrl: string | null;
  assignmentTitle: string;
  maxScore: number;
  dueDate: string;
  studentAnswers: Array<{
    questionId: number;
    questionContent: string;
    questionPoints: number;
    selectedOptionIds: number[];
    earnedPoints: number;
  }>;
  grade: GradeDetails | null;
};

/** Submit request body — matches SubmitAssignmentRequest.java */
export type SubmitAssignmentBody = {
  /** QUIZ: list of answers */
  questionAnswers?: Array<{ questionId: number; selectedOptionIds: number[] }>;
  /** ESSAY: text content */
  essayContent?: string;
  /** ESSAY with file: S3 URL */
  fileUrl?: string;
  /** Required and must be true to finalize submission */
  confirm: boolean;
};

/** Save draft body — matches SaveDraftRequest.java */
export type SaveDraftBody = {
  questionAnswers?: Array<{ questionId: number; selectedOptionIds: number[] }>;
  essayContent?: string;
  fileUrl?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Base URL verified against nginx.conf:
 *   location /api/v1/ → proxy_pass http://assignment-service:8080 (rewrite keeps path)
 * Spring controllers use /api/v1/assignments and /api/v1/submissions
 */
const ASSIGNMENT_SERVICE_URL = `${API_URL.replace(/\/$/, "")}/api/v1`;

const ASSIGNMENTS = "/assignments";
const SUBMISSIONS = "/submissions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isApiSuccessEnvelope(
  payload: unknown
): payload is ApiSuccessEnvelope<unknown> {
  if (!payload || typeof payload !== "object") return false;
  const c = payload as Partial<ApiSuccessEnvelope<unknown>>;
  return (
    typeof c.timestamp === "string" &&
    typeof c.status === "number" &&
    typeof c.message === "string" &&
    "data" in c
  );
}

function unwrapEnvelope<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  if (!isApiSuccessEnvelope(response.data)) return response;
  return { ...response, data: response.data.data as T };
}

/**
 * Unwrap a Spring Page<T> into its `content` array.
 * Returns [] safely if the response is not paginated.
 */
function unwrapPage<T>(page: PageResponse<T> | T[]): T[] {
  if (Array.isArray(page)) return page;
  if (page && typeof page === "object" && "content" in page) {
    return (page as PageResponse<T>).content;
  }
  return [];
}

export function mapError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as
      | { message?: string; detail?: string; error?: string }
      | string
      | undefined;

    if (typeof payload === "string" && payload.length > 0) {
      return new Error(payload);
    }
    if (payload && typeof payload === "object") {
      const msg = payload.message || payload.detail || payload.error;
      if (msg) return new Error(msg);
    }

    // Surface HTTP status code info if no message
    const status = error.response?.status;
    if (status) return new Error(`Lỗi ${status} từ server.`);
  }
  if (error instanceof Error) return error;
  return new Error("Không thể xử lý yêu cầu lúc này.");
}

async function attachAuthHeader(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const assignmentClient = axios.create({
  baseURL: ASSIGNMENT_SERVICE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

assignmentClient.interceptors.request.use((cfg) => attachAuthHeader(cfg));

assignmentClient.interceptors.response.use(
  (response) => unwrapEnvelope(response),
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(mapError(error));
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshSession();
      originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`;
      return assignmentClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

// ─── API ──────────────────────────────────────────────────────────────────────

export const assignmentApi = {
  // ── SHARED — list & detail ─────────────────────────────────────────────────

  /**
   * GET /api/v1/assignments/team/{teamId}?page=0&size=50&sortBy=dueDate
   * Returns Spring Page<AssignmentSummaryDto>; unwraps to content[].
   * Accessible by STUDENT and TEACHER.
   */
  getAssignments: async (teamId: number): Promise<Assignment[]> => {
    const response = await assignmentClient.get<PageResponse<Assignment> | Assignment[]>(
      `${ASSIGNMENTS}/team/${teamId}`,
      { params: { page: 0, size: 50, sortBy: "dueDate" } }
    );
    return unwrapPage(response.data);
  },

  /**
   * GET /api/v1/assignments/{assignmentId}
   * Returns AssignmentDetailDto (includes questions for QUIZ type).
   * Accessible by STUDENT and TEACHER.
   */
  getAssignmentDetail: async (assignmentId: number): Promise<AssignmentDetail> => {
    const response = await assignmentClient.get<AssignmentDetail>(
      `${ASSIGNMENTS}/${assignmentId}`
    );
    return response.data;
  },

  // ── STUDENT — submission lifecycle ────────────────────────────────────────

  /**
   * POST /api/v1/submissions/assignment/{assignmentId}/start
   * Creates DRAFT submission. Returns ViewSubmissionDto.
   * STUDENT only.
   */
  startAssignment: async (assignmentId: number): Promise<ViewSubmission> => {
    const response = await assignmentClient.post<ViewSubmission>(
      `${SUBMISSIONS}/assignment/${assignmentId}/start`
    );
    return response.data;
  },

  /**
   * GET /api/v1/submissions/assignment/{assignmentId}/current
   * Returns current DRAFT or SUBMITTED submission (null if none).
   * STUDENT only — returns 404 when no submission exists.
   */
  getCurrentSubmission: async (assignmentId: number): Promise<ViewSubmission | null> => {
    try {
      const response = await assignmentClient.get<ViewSubmission>(
        `${SUBMISSIONS}/assignment/${assignmentId}/current`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * @deprecated Use getCurrentSubmission instead.
   * Kept for backward compatibility with AssignmentDetailScreen.
   */
  getMySubmission: async (assignmentId: number): Promise<ViewSubmission | null> => {
    return assignmentApi.getCurrentSubmission(assignmentId);
  },

  /**
   * POST /api/v1/submissions/{submissionId}/save-draft
   * Auto-save quiz answers while doing assignment.
   * Body: { questionAnswers: [{questionId, selectedOptionIds}] }
   * STUDENT only.
   */
  saveAnswer: async (
    submissionId: number,
    questionId: number,
    selectedOptionIds: number[]
  ): Promise<void> => {
    await assignmentClient.post<void>(
      `${SUBMISSIONS}/${submissionId}/save-draft`,
      {
        questionAnswers: [{ questionId, selectedOptionIds }],
      } as SaveDraftBody
    );
  },

  /**
   * POST /api/v1/submissions/{submissionId}/save-draft
   * Batch save draft (multiple answers or essay text).
   * STUDENT only.
   */
  saveDraft: async (submissionId: number, body: SaveDraftBody): Promise<void> => {
    await assignmentClient.post<void>(
      `${SUBMISSIONS}/${submissionId}/save-draft`,
      body
    );
  },

  /**
   * POST /api/v1/submissions/assignment/{assignmentId}/submit
   * Final submission. confirm must be true.
   *
   * For QUIZ: { questionAnswers: [{questionId, selectedOptionIds}], confirm: true }
   * For ESSAY with file: { fileUrl: "...", confirm: true }
   * For ESSAY text: { essayContent: "...", confirm: true }
   *
   * Returns: { message: string, submittedAt: string }
   * STUDENT only.
   */
  submitAssignment: async (
    assignmentId: number,
    body: Omit<SubmitAssignmentBody, "confirm">
  ): Promise<{ message: string; submittedAt: string }> => {
    const response = await assignmentClient.post<{ message: string; submittedAt: string }>(
      `${SUBMISSIONS}/assignment/${assignmentId}/submit`,
      { ...body, confirm: true } satisfies SubmitAssignmentBody
    );
    return response.data;
  },

  /**
   * Convenience: submit an ESSAY with a file URL.
   * Wraps submitAssignment.
   */
  submitEssay: async (
    assignmentId: number,
    payload: { fileUrl: string; confirm: boolean }
  ): Promise<void> => {
    await assignmentApi.submitAssignment(assignmentId, { fileUrl: payload.fileUrl });
  },

  /**
   * GET /api/v1/submissions/{submissionId}
   * Get own submission details (with answers, earned points, grade if graded).
   * STUDENT only — must own the submission.
   */
  getMySubmissionById: async (submissionId: number): Promise<ViewSubmission> => {
    const response = await assignmentClient.get<ViewSubmission>(
      `${SUBMISSIONS}/${submissionId}`
    );
    return response.data;
  },

  /**
   * GET /api/v1/submissions/{submissionId}/grade
   * Get grade & feedback for a GRADED submission.
   * STUDENT only — must own the submission.
   */
  getMyGrade: async (submissionId: number): Promise<GradeDetails> => {
    const response = await assignmentClient.get<GradeDetails>(
      `${SUBMISSIONS}/${submissionId}/grade`
    );
    return response.data;
  },

  /**
   * GET /api/v1/submissions/attempt-history/{assignmentId}
   * Returns all past attempts (List<AttemptHistoryDto>).
   * STUDENT only.
   */
  getAttemptHistory: async (assignmentId: number): Promise<unknown[]> => {
    const response = await assignmentClient.get<unknown[]>(
      `${SUBMISSIONS}/attempt-history/${assignmentId}`
    );
    return response.data;
  },

  /**
   * GET /api/v1/submissions/can-attempt/{assignmentId}
   * Returns { canAttempt: boolean, remainingAttempts: number } (-1 = unlimited).
   * STUDENT only.
   */
  canAttempt: async (assignmentId: number): Promise<{ canAttempt: boolean; remainingAttempts: number }> => {
    const response = await assignmentClient.get<{ canAttempt: boolean; remainingAttempts: number }>(
      `${SUBMISSIONS}/can-attempt/${assignmentId}`
    );
    return response.data;
  },

  // ── TEACHER — assignment management ─────────────────────────────────────

  /**
   * POST /api/v1/assignments/create
   * Create a new assignment. Returns AssignmentSummaryDto.
   * TEACHER only.
   */
  createAssignment: async (
    payload: CreateAssignmentPayload
  ): Promise<Assignment> => {
    const response = await assignmentClient.post<Assignment>(
      `${ASSIGNMENTS}/create`,
      payload
    );
    return response.data;
  },

  /**
   * GET /api/v1/assignments/my-assignments?page=0&size=50&sortBy=createdAt
   * Returns Page<AssignmentTeacherViewDto>; unwraps to content[].
   * TEACHER only.
   */
  getMyAssignments: async (page = 0): Promise<AssignmentTeacherView[]> => {
    const response = await assignmentClient.get<
      PageResponse<AssignmentTeacherView> | AssignmentTeacherView[]
    >(`${ASSIGNMENTS}/my-assignments`, {
      params: { page, size: 50, sortBy: "createdAt" },
    });
    return unwrapPage(response.data);
  },

  /**
   * DELETE /api/v1/assignments/{assignmentId}/archive
   * Soft-delete (archive). Returns 204.
   * TEACHER only — must be assignment creator.
   */
  archiveAssignment: async (assignmentId: number): Promise<void> => {
    await assignmentClient.delete<void>(
      `${ASSIGNMENTS}/${assignmentId}/archive`
    );
  },

  // ── TEACHER — grading ────────────────────────────────────────────────────

  /**
   * GET /api/v1/submissions/assignment/{assignmentId}/pending
   * Returns Page<SubmissionGradingListDto>; unwraps to content[].
   * TEACHER only — must be assignment creator.
   */
  getPendingSubmissions: async (
    assignmentId: number
  ): Promise<SubmissionGradingItem[]> => {
    const response = await assignmentClient.get<
      PageResponse<SubmissionGradingItem> | SubmissionGradingItem[]
    >(`${SUBMISSIONS}/assignment/${assignmentId}/pending`, {
      params: { page: 0, size: 100 },
    });
    return unwrapPage(response.data);
  },

  /**
   * GET /api/v1/submissions/assignment/{assignmentId}
   * Returns ALL submissions (pending + graded).
   * TEACHER only — must be assignment creator.
   */
  getAllSubmissions: async (
    assignmentId: number
  ): Promise<SubmissionGradingItem[]> => {
    const response = await assignmentClient.get<
      PageResponse<SubmissionGradingItem> | SubmissionGradingItem[]
    >(`${SUBMISSIONS}/assignment/${assignmentId}`, {
      params: { page: 0, size: 100 },
    });
    return unwrapPage(response.data);
  },

  /**
   * POST /api/v1/submissions/{submissionId}/grade
   * Grade a submission. Returns GradeDetailsDto.
   * Body: { score: number, feedback?: string }
   * TEACHER only — must be assignment creator.
   */
  gradeSubmission: async (
    submissionId: number,
    payload: GradeSubmissionPayload
  ): Promise<GradeDetails> => {
    const response = await assignmentClient.post<GradeDetails>(
      `${SUBMISSIONS}/${submissionId}/grade`,
      payload
    );
    return response.data;
  },
};