/**
 * Assignment Module Types & Interfaces
 * Synchronized with Backend DTOs (Spring Boot)
 */

// ============ ENUMS ============

export enum AssignmentType {
  ESSAY = "ESSAY",
  QUIZ = "QUIZ",
}

export enum AssignmentStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  SUBMITTED = "SUBMITTED",
  GRADED = "GRADED",
}

export enum SubmissionStatus {
  SUBMITTED = "SUBMITTED",
  GRADED = "GRADED",
}

// ============ CORE INTERFACES ============

/**
 * Material (tài liệu đính kèm)
 * Synchronized with Backend: MaterialDTO
 */
export interface Material {
  id: number;
  name: string;
  url: string;
  type: string; // MIME type: 'pdf', 'docx', 'pptx', etc.
}

/**
 * AnswerOption (lựa chọn cho câu quiz)
 * Synchronized with Backend: AnswerOptionDTO
 */
export interface AnswerOption {
  id?: number;
  content: string;
  correct: boolean;
}

/**
 * Question (câu hỏi cho QUIZ)
 * Synchronized with Backend: QuestionDTO
 */
export interface Question {
  id?: number;
  content: string;
  answerOptions: AnswerOption[];
}

/**
 * Assignment (bài tập)
 * Base interface for API responses
 * Synchronized with Backend: AssignmentResponseDTO
 */
export interface Assignment {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string; // ISO 8601 format: "2025-12-15T23:59:00"
  createdAt: string; // ISO 8601 format
  type: AssignmentType;
  teamId: number;
  materials?: Material[];
  questions?: Question[];
}

/**
 * AssignmentRequest (data gửi lên khi tạo/update bài tập)
 * Synchronized with Backend: AssignmentRequestDTO
 */
export interface AssignmentRequest {
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string; // ISO 8601 format
  type: AssignmentType;
  teamId: number;
  materialIds?: number[]; // IDs of existing materials
  questions?: Question[]; // Only for QUIZ type
}

/**
 * StudentSubmission (bài nộp của sinh viên)
 */
export interface StudentSubmission {
  id: number;
  studentId: number;
  studentName: string;
  studentAvatar: string;
  assignmentType: AssignmentType;
  status: SubmissionStatus;
  submittedDate: string; // ISO 8601 format
  content: string;
  attachmentFile?: {
    filename: string;
    fileType: string;
    fileUrl: string;
  };
  earnedPoints?: number;
  grade?: number;
  feedback?: string;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string>;
}

// ============ UI/FORM MODELS ============

/**
 * Form data model for CreateAssignmentForm
 */
export interface CreateAssignmentFormData {
  title: string;
  description: string;
  assignmentType: AssignmentType;
  maxPoints: number;
  dueDate: string; // HTML datetime-local format: "2025-12-15T23:59"
  attachments: File[];
  teams: number[]; // team IDs
  questions?: Question[];
}

/**
 * Assignment display model with formatted dates
 */
export interface AssignmentDisplay extends Assignment {
  dueDateFormatted: string;
  createdDateFormatted: string;
  isOverdue: boolean;
}

/**
 * Submission for display with status badge
 */
export interface SubmissionDisplay extends StudentSubmission {
  submittedDateFormatted: string;
  statusBadge: {
    label: string;
    color: string; // Tailwind class
  };
}
