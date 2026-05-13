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
  getByTeam: async (teamId: number, page = 0, size = 20): Promise<any> => {
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
   * Archive an assignment (TEACHER only)
   */
  archive: async (assignmentId: number): Promise<void> => {
    await axiosV1.patch(`/api/v1/assignments/${assignmentId}/archive`);
  },
};

/**
 * Submission & Attempt History API Service
 */
export const submissionApi = {
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
   * Submit an assignment
   */
  submit: async (assignmentId: number, data: any): Promise<any> => {
    const response = await axiosV1.post(
      `/api/v1/submissions/submit/${assignmentId}`,
      data
    );
    return response.data;
  },
};
