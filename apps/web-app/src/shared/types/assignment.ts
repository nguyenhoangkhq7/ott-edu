import { AssignmentType } from './quiz';

/**
 * Assignment form types for Create/Update operations
 */
export interface CreateAssignmentFormData {
  title: string;
  instructions: string;
  type: AssignmentType;
  dueDate: string; // ISO datetime format
  maxScore: number;
  teamIds: number[];
  
  // QUIZ-specific
  maxAttempts?: number;
  questions?: QuestionFormData[];
  
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
