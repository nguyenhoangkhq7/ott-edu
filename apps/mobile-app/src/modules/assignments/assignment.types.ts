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