import { assignmentClient } from "./axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AssessmentDTO {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string;
  type: 'QUIZ' | 'ESSAY';
  teamId: number;
  questions: QuestionDTO[];
}

export interface QuestionDTO {
  id: number;
  content: string;
  points: number;
  questionType: string;
  options: AnswerOptionDTO[];
}

export interface AnswerOptionDTO {
  id: number;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface SubmitQuizRequest {
  assignmentId: number;
  accountId: number;
  teamMemberId: number;
  answers: {
    questionId: number;
    selectedOptionIds: number[];
  }[];
}

export interface SubmissionResultResponse {
  id: number;
  assignmentId: number;
  score: number;
  submittedAt: string;
  isLate: boolean;
}

class AssessmentService {
  async getAssignmentsByTeam(teamId: number): Promise<AssessmentDTO[]> {
    const response = await assignmentClient.get<ApiResponse<AssessmentDTO[]>>(`/api/assignments/team/${teamId}`);
    return response.data.data;
  }

  async getAssignmentDetail(id: number): Promise<AssessmentDTO> {
    const response = await assignmentClient.get<ApiResponse<AssessmentDTO>>(`/api/assignments/${id}`);
    return response.data.data;
  }

  async submitQuiz(payload: SubmitQuizRequest): Promise<SubmissionResultResponse> {
    const response = await assignmentClient.post<ApiResponse<SubmissionResultResponse>>('/api/quiz/submit', payload);
    return response.data.data;
  }
}

export const assessmentService = new AssessmentService();
