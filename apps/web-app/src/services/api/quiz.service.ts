import { httpService } from './http.service';
import {
  Assignment,
  AssignmentDetail,
  Submission,
  SubmissionResult,
} from '@/shared/types/quiz';

// Gateway route: /api/assignment/ -> assignment-service:8080/
// Controller: @RequestMapping("/assignments")
// So full path: /api/assignment/assignments/...
const BASE = '/api/assignment/assignments';

export const quizService = {
  /**
   * Lấy danh sách assignments theo lớp học (teamId)
   */
  getAssignments: async (teamId: number): Promise<Assignment[]> => {
    return httpService.get<Assignment[]>(`${BASE}/team/${teamId}`);
  },

  /**
   * Lấy chi tiết assignment kèm câu hỏi (không có đáp án đúng)
   */
  getAssignmentDetail: async (assignmentId: number): Promise<AssignmentDetail> => {
    return httpService.get<AssignmentDetail>(`${BASE}/${assignmentId}`);
  },

  /**
   * Bắt đầu làm bài - tạo hoặc resume submission
   * Header X-User-Id được gắn tự động từ Gateway (auth_request set header)
   */
  startAssignment: async (assignmentId: number): Promise<Submission> => {
    return httpService.post<Submission>(`${BASE}/${assignmentId}/start`, {});
  },

  /**
   * Kiểm tra học viên đã có submission chưa
   */
  getMySubmission: async (assignmentId: number): Promise<Submission | null> => {
    try {
      return await httpService.get<Submission | null>(`${BASE}/${assignmentId}/my-submission`);
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
    return httpService.post<void>(`${BASE}/submission/${submissionId}/answer`, {
      questionId,
      selectedOptionIds,
    });
  },

  /**
   * Nộp bài và nhận kết quả điểm
   */
  submitAssignment: async (submissionId: number): Promise<SubmissionResult> => {
    return httpService.post<SubmissionResult>(
      `${BASE}/submission/${submissionId}/submit`,
      {}
    );
  },
};
