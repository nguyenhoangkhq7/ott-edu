// ─── Enums ───────────────────────────────────────────────────────────────────

export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTI_CHOICE = "MULTI_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
}

export enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  GRADED = "GRADED",
}

export enum AssignmentType {
  QUIZ = "QUIZ",
  ESSAY = "ESSAY",
}

// ─── Shared / Student Types ───────────────────────────────────────────────────

export type AnswerOption = {
  id: number;
  content: string;
  displayOrder: number;
};

export type Question = {
  id: number;
  content: string;
  type: QuestionType;
  points: number;
  displayOrder: number;
  options: AnswerOption[];
};

export type AssignmentDetail = {
  id: number;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string;
  type: AssignmentType;
  teamIds: number[];
  questions: Question[];
  timeLimit?: number;
  maxAttempts?: number;
  materialUrls?: string[];
};

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

export type Submission = {
  id: number;
  accountId: number;
  submittedAt: string;
  status: SubmissionStatus;
  assignment: { id: number };
};

export type SubmissionResult = {
  submissionId: number;
  score: number;
  maxScore: number;
  feedback: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctQuestions?: number | null;
};

export type LocalAnswers = Record<number, number[]>;

// ─── Pagination Envelope ──────────────────────────────────────────────────────

/**
 * Spring Data Page<T> response envelope.
 * The gateway wraps this inside ApiSuccessEnvelope, so by the time
 * our Axios interceptor runs, `data` here IS the raw Spring Page object.
 */
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed current page
  size: number;
};

// ─── Teacher — Request Payloads ───────────────────────────────────────────────

export type QuestionOptionRequest = {
  content: string;
  isCorrect: boolean;
  displayOrder: number;
};

export type QuestionRequest = {
  content: string;
  type: QuestionType;
  points: number;
  displayOrder: number;
  options: QuestionOptionRequest[];
};

export type CreateAssignmentPayload = {
  title: string;
  instructions?: string;
  type: AssignmentType;
  /** ISO-8601 datetime string with UTC timezone, e.g. "2025-12-31T23:59:00.000Z" */
  dueDate: string;
  maxScore: number;
  teamIds: number[];
  /** QUIZ only – null/undefined means unlimited */
  maxAttempts?: number;
  /** QUIZ only – duration in minutes (e.g. 30, 60, 120) */
  timeLimit?: number;
  /** QUIZ only – list of questions with options */
  questions?: QuestionRequest[];
  materialUrls?: string[];
};

export type GradeSubmissionPayload = {
  score: number;
  feedback: string;
};

export type EssaySubmitPayload = {
  fileUrl: string;
  confirm: boolean;
};

// ─── Teacher — Response DTOs ──────────────────────────────────────────────────

/** Maps to AssignmentTeacherViewDto.java */
export type AssignmentTeacherView = {
  id: number;
  title: string;
  type: AssignmentType;
  dueDate: string;
  maxScore: number;
  archived: boolean;
  teamIds: number[];
  totalSubmissions: number;
  gradedCount: number;
  pendingCount: number;
  createdAt: string;
};

/** Maps to SubmissionGradingListDto.java */
export type SubmissionGradingItem = {
  submissionId: number;
  studentAccountId: number;
  assignmentId: number;
  status: SubmissionStatus;
  submittedAt: string;
  isLate: boolean;
  fileUrl: string | null;
  isGraded: boolean;
  currentScore: number | null;
  gradeRevision: number;
  studentCode?: string;
  studentName?: string;
};

/** Maps to GradeDetailsDto.java */
export type GradeDetails = {
  id: number;
  score: number;
  feedback: string;
  gradedAt: string;
  revision: number;
};