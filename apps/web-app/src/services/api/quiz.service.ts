import { assignmentHttpService } from './assignment-http.service';
import {
  Assignment,
  AssignmentDetail,
  Submission,
  SubmissionResult,
} from '@/shared/types/quiz';

// Assignment Service runs at: /api/assignment/ (via nginx gateway)
// Use separate client (assignmentHttpService) that doesn't have /api/core baseURL
const BASE = '/api/assignment/assignments';

export const quizService = {
  /**
   * Lấy danh sách assignments theo lớp học (teamId)
   */
  getAssignments: async (teamId: number): Promise<Assignment[]> => {
    return assignmentHttpService.get<Assignment[]>(`${BASE}/team/${teamId}`);
  },

  /**
   * Lấy chi tiết assignment kèm câu hỏi (không có đáp án đúng)
   */
  getAssignmentDetail: async (assignmentId: number): Promise<AssignmentDetail> => {
    return assignmentHttpService.get<AssignmentDetail>(`${BASE}/${assignmentId}`);
  },

  /**
   * Bắt đầu làm bài - tạo hoặc resume submission
   * Header X-User-Id được gắn tự động từ Gateway (auth_request set header)
   */
  startAssignment: async (assignmentId: number): Promise<Submission> => {
    return assignmentHttpService.post<Submission>(`${BASE}/${assignmentId}/start`, {});
  },

  /**
   * Kiểm tra học viên đã có submission chưa
   */
  getMySubmission: async (assignmentId: number): Promise<Submission | null> => {
    try {
      return await assignmentHttpService.get<Submission | null>(`${BASE}/${assignmentId}/my-submission`);
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
    return assignmentHttpService.post<void>(`${BASE}/submission/${submissionId}/answer`, {
      questionId,
      selectedOptionIds,
    });
  },

  /**
   * Nộp bài và nhận kết quả điểm
   */
  submitAssignment: async (submissionId: number): Promise<SubmissionResult> => {
    return assignmentHttpService.post<SubmissionResult>(
      `${BASE}/submission/${submissionId}/submit`,
      {}
    );
  },
};
