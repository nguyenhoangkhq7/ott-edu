import axios from 'axios';
import { getAccessToken } from './token-store';
import { CreateAssignmentFormData, AttemptHistory, AttemptStatus } from '@/shared/types/assignment';
import { Assignment, AssignmentDetail } from '@/shared/types/quiz';

/**
 * Create axios instance for V1 API (no base URL)
 * This avoids the /api/core prefix from default axiosClient
 */
const axiosV1 = axios.create({
  baseURL: '', // Empty - rely on next.config rewrites
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization interceptor
axiosV1.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Assignment API Service
 */
export const assignmentApi = {
  /**
   * Create a new assignment (TEACHER only)
   */
  create: async (data: CreateAssignmentFormData): Promise<Assignment> => {
    const response = await axiosV1.post('/api/v1/assignments/create', data);
    return response.data;
  },

  /**
   * Update an existing assignment (TEACHER only)
   */
  update: async (assignmentId: number, data: CreateAssignmentFormData): Promise<Assignment> => {
    const response = await axiosV1.put(`/api/v1/assignments/${assignmentId}`, data);
    return response.data;
  },

  /**
   * Get assignments for a team (STUDENT view)
   */
  getByTeam: async (teamId: number, page = 0, size = 20): Promise<unknown> => {
    const response = await axiosV1.get(
      `/api/v1/assignments/team/${teamId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  /**
   * Get assignment detail (both TEACHER and STUDENT)
   */
  getDetail: async (assignmentId: number): Promise<AssignmentDetail> => {
    const response = await axiosV1.get(`/api/v1/assignments/${assignmentId}`);
    return response.data;
  },

  /**
   * Delete/Archive an assignment (TEACHER only)
   */
  delete: async (assignmentId: number): Promise<void> => {
    try {
      // Try PATCH first (more common for archive operations)
      await axiosV1.patch(`/api/v1/assignments/${assignmentId}/archive`);
    } catch (error: unknown) {
      // If PATCH fails, try DELETE
      if ((error as { response?: { status?: number } }).response?.status === 405 || (error as { response?: { status?: number } }).response?.status === 404) {
        await axiosV1.delete(`/api/v1/assignments/${assignmentId}/archive`);
      } else {
        throw error;
      }
    }
  },

  /**
   * Get student calendar events aggregated by month and year
   */
  getCalendarEvents: async (month: number, year: number): Promise<Array<{ id: number; title: string; type: 'ASSIGNMENT' | 'QUIZ'; courseName: string; dueDate: string }>> => {
    const response = await axiosV1.get(`/api/v1/calendar/my-events?month=${month}&year=${year}`);
    return response.data;
  },
};

/**
 * Submission & Attempt History API Service
 */
export const submissionApi = {
  /**
   * Start/Initialize a submission (creates submission record)
   * Returns Submission object with submissionId
   */
  startAssignment: async (assignmentId: number): Promise<unknown> => {
    const response = await axiosV1.post(
      `/api/v1/submissions/assignment/${assignmentId}/start`,
      {}
    );
    return response.data; // Returns ViewSubmissionDto with { id, submissionId, assignmentId, status, ... }
  },

  /**
   * Get attempt history for a student on a specific assignment
   */
  getAttemptHistory: async (assignmentId: number): Promise<AttemptHistory[]> => {
    const response = await axiosV1.get(
      `/api/v1/submissions/attempt-history/${assignmentId}`
    );
    return response.data;
  },

  /**
   * Check if student can attempt a quiz again
   */
  canAttempt: async (assignmentId: number): Promise<AttemptStatus> => {
    const response = await axiosV1.get(
      `/api/v1/submissions/can-attempt/${assignmentId}`
    );
    return response.data;
  },

  /**
   * Submit an assignment (essay or quiz)
   */
  submit: async (assignmentId: number, data: unknown): Promise<unknown> => {
    const response = await axiosV1.post(
      `/api/v1/submissions/assignment/${assignmentId}/submit`,
      data
    );
    return response.data;
  },

  /**
   * Get pending submissions for teacher grading
   */
  getPendingSubmissions: async (assignmentId: number): Promise<unknown[]> => {
    const response = await axiosV1.get(
      `/api/v1/submissions/assignment/${assignmentId}/pending`
    );
    return response.data;
  },

  /**
   * Get ALL submissions for an assignment (pending + graded) - TEACHER only
   * Primary endpoint: GET /api/v1/submissions/assignment/{id}
   * Fallback: GET /api/v1/submissions/assignment/{id}/pending
   */
  getAllSubmissions: async (assignmentId: number): Promise<unknown[]> => {
    try {
      // Primary: /assignment/{id} returns all submissions (graded + pending)
      const response = await axiosV1.get(
        `/api/v1/submissions/assignment/${assignmentId}`
      );
      // Handle Spring Page object
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.content)) return data.content;
      return [];
    } catch (err: unknown) {
      // Fallback to /pending if primary fails
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404 || status === 405 || status === 403) {
        const response = await axiosV1.get(
          `/api/v1/submissions/assignment/${assignmentId}/pending`
        );
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.content)) return data.content;
        return [];
      }
      throw err;
    }
  },

  /**
   * Grade a submission (TEACHER only)
   */
  gradeSubmission: async (submissionId: number, data: { score: number; feedback: string }): Promise<unknown> => {
    const response = await axiosV1.post(
      `/api/v1/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  },

  /**
   * Get detailed student submission for teacher (TEACHER only)
   */
  getSubmissionDetailForTeacher: async (submissionId: number): Promise<unknown> => {
    const response = await axiosV1.get(
      `/api/v1/submissions/${submissionId}/detail`
    );
    return response.data;
  },

  /**
   * Get grade and feedback for a submission (STUDENT view)
   */
  getGrade: async (submissionId: number): Promise<unknown> => {
    const response = await axiosV1.get(
      `/api/v1/submissions/${submissionId}/grade`
    );
    return response.data;
  },

  /**
   * Get current submission for a student on an assignment
   */
  getCurrentSubmission: async (assignmentId: number): Promise<unknown> => {
    try {
      const response = await axiosV1.get(
        `/api/v1/submissions/assignment/${assignmentId}/current`
      );
      return response.data;
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } }).response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
