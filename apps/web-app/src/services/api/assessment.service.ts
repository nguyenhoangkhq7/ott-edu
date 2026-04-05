import { assignmentClient } from "./axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AnswerOptionDTO {
  id: number;
  content: string;
  correct: boolean;
  displayOrder: number;
}

export interface QuestionDTO {
  id: number;
  content: string;
  points: number;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'ESSAY';
  options: AnswerOptionDTO[];
}

export interface AssessmentDTO {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string;
  type: 'QUIZ' | 'ESSAY';
  teamId: number;
  durationMinutes: number;
  questions: QuestionDTO[];
}

export interface SubmitQuizRequest {
  assignmentId: number;
  accountId: number;
  teamMemberId: number;
  answers: {
    questionId: number;
    selectedOptionIds: number[];
    content?: string;
  }[];
}

export interface SubmissionResultResponse {
  id: number;
  assignmentId: number;
  score: number;
  maxScore: number;
  submittedAt: string;
  isLate: boolean;
}

class AssessmentService {
  async getAssignmentsByTeam(teamId: number): Promise<AssessmentDTO[]> {
    const response = await assignmentClient.get<ApiResponse<AssessmentDTO[]>>(`/assignments/team/${teamId}`);
    return response.data.data;
  }

  async getAssignmentDetail(id: number): Promise<AssessmentDTO> {
    const response = await assignmentClient.get<ApiResponse<AssessmentDTO>>(`/assignments/${id}`);
    return response.data.data;
  }

  async submitQuiz(payload: SubmitQuizRequest): Promise<SubmissionResultResponse> {
    const response = await assignmentClient.post<ApiResponse<SubmissionResultResponse>>('/quiz/submit', payload);
    return response.data.data;
  }
}

export const assessmentService = new AssessmentService();
