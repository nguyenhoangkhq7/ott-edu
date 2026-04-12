// Quiz and Assignment Types - Based on Database Schema (Class Diagram)

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

export enum AssignmentType {
  QUIZ = 'QUIZ',
  ESSAY = 'ESSAY',
}

// AnswerOption - Câu trả lời có thể chọn (Backend: không expose isCorrect)
export type AnswerOption = {
  id: number;
  content: string;
  displayOrder: number;
};

// Question - Câu hỏi kèm các lựa chọn
export type Question = {
  id: number;
  content: string;
  type: QuestionType;
  points: number;
  displayOrder: number;
  options: AnswerOption[];
};

// AssignmentDetail - Chi tiết bài kiểm tra kèm câu hỏi
export type AssignmentDetail = {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string; // ISO datetime
  type: AssignmentType;
  teamIds: number[];
  questions: Question[];
};

// Assignment - Bài kiểm tra trong danh sách (chưa có câu hỏi)
export type Assignment = {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string;
  createdAt: string;
  archived: boolean;
  type: AssignmentType;
  teamIds: number[];
  departmentId: number;
};

// Submission - Bài nộp của học viên (từ backend)
export type Submission = {
  id: number;
  accountId: number;
  submittedAt: string;
  status: SubmissionStatus;
  assignment: { id: number };
};

// Grade - Điểm
export type Grade = {
  id: number;
  score: number;
  maxScore: number;
  feedback: string;
  gradedAt: string;
};

// SubmissionResult - Kết quả sau khi nộp bài
export type SubmissionResult = {
  submissionId: number;
  score: number;
  maxScore: number;
  feedback: string;
  totalQuestions: number;
  answeredQuestions: number;
};

// Local state for tracking selected answers during quiz
export type LocalAnswers = Record<number, number[]>; // questionId -> selectedOptionIds[]
