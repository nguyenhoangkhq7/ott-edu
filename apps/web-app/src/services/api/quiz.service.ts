import { assignmentHttpService } from './assignment-http.service';
import {
  Assignment,
  AssignmentDetail,
  Submission,
  SubmissionResult,
} from '@/shared/types/quiz';

// Assignment Service runs at: /api/v1/ (via assignment-service)
// Use separate client (assignmentHttpService) that doesn't have /api/core baseURL
const BASE = '/api/v1/assignments';

export const quizService = {
  /**
   * Lấy danh sách assignments theo lớp học (teamId) với pagination
   */
  getAssignments: async (teamId: number): Promise<Assignment[]> => {
    const response = await assignmentHttpService.get<{ content: Assignment[]; totalElements: number }>(
      `${BASE}/team/${teamId}?page=0&size=50`
    );
    return Array.isArray(response) ? response : (response?.content || []);
  },

  /**
   * Lấy chi tiết assignment kèm câu hỏi (không có đáp án đúng)
   */
  getAssignmentDetail: async (assignmentId: number): Promise<AssignmentDetail> => {
    return assignmentHttpService.get<AssignmentDetail>(`${BASE}/${assignmentId}`);
  },

  /**
   * Bắt đầu làm bài - tạo hoặc resume submission
   */
  startAssignment: async (assignmentId: number): Promise<Submission> => {
    return assignmentHttpService.post<Submission>(`/api/v1/quiz/${assignmentId}/start`, {});
  },

  /**
   * Kiểm tra học viên đã có submission chưa
   */
  getMySubmission: async (assignmentId: number): Promise<Submission | null> => {
    try {
      return await assignmentHttpService.get<Submission | null>(`/api/v1/quiz/${assignmentId}/my-submission`);
    } catch {
      return null;
    }
  },

  /**
   * Auto-save đáp án một câu hỏi
   */
  saveAnswer: async (
    submissionId: number,
    questionId: number,
    selectedOptionIds: number[]
  ): Promise<void> => {
    return assignmentHttpService.post<void>(`/api/v1/quiz/submission/${submissionId}/answer`, {
      questionId,
      selectedOptionIds,
    });
  },

  /**
   * Nộp bài và nhận kết quả điểm
   */
  submitAssignment: async (submissionId: number): Promise<SubmissionResult> => {
    return assignmentHttpService.post<SubmissionResult>(
      `/api/v1/quiz/submission/${submissionId}/submit`,
      {}
    );
  },
};
