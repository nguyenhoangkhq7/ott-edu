import { AssignmentType } from './quiz';

/**
 * Assignment form types for Create/Update operations
 */
export interface CreateAssignmentFormData {
  title: string;
  instructions: string;
  type: AssignmentType;
  dueDate: string; // ISO 8601 UTC datetime format (YYYY-MM-DDTHH:mm:ss.sssZ)
  maxScore: number;
  teamIds: number[];
  
  // QUIZ-specific
  maxAttempts?: number;
  timeLimit?: number; // Duration in minutes (e.g., 30, 60, 120) - only for QUIZ type
  questions?: QuestionFormData[];
  /** Whether to allow students to view their score and feedback (default: true) */
  allowViewScore?: boolean;
  /** Whether to allow students to review their selected answers after submission (default: false) */
  allowReview?: boolean;
  // Legacy field names (for backward compatibility with backend)
  showScoreAfterSubmit?: boolean;
  showAnswersAfterSubmit?: boolean;
  
  // ESSAY-specific
  materialUrls?: string[];
}

export interface QuestionFormData {
  id?: number;
  content: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TRUE_FALSE';
  points: number;
  displayOrder: number;
  options: OptionFormData[];
}

export interface OptionFormData {
  id?: number;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

/**
 * Attempt history for students taking quizzes
 */
export interface AttemptHistory {
  submissionId: number;
  attemptNumber: number;
  submittedAt: string; // ISO datetime
  score?: number;
  maxScore: number;
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED';
  feedback?: string;
}

/**
 * Quiz attempt status
 */
export interface AttemptStatus {
  canAttempt: boolean;
  remainingAttempts: number; // -1 means unlimited
}
