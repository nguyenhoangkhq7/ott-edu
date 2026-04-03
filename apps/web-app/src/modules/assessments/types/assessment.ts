export type AssessmentStatus = 'AVAILABLE' | 'COMPLETED' | 'OVERDUE' | 'CLOSED';

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  description: string;
  status: AssessmentStatus;
  dueDate: string;
  durationMinutes: number;
  submittedDate?: string;
  score?: number;
  maxScore?: number;
  totalQuestions: number;
}

export interface QuestionOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D'
  content: string;
}

export interface Question {
  id: string;
  text: string;
  points: number;
  options: QuestionOption[];
  imageUrl?: string;
}

export interface ExamSession {
  assessmentId: string;
  questions: Question[];
  timeRemainingSeconds: number;
}

export interface ClassPerformance {
  averageScorePercentage: number;
  userScorePercentage: number;
  userRank: number;
  totalStudents: number;
}

export interface TopicPerformance {
  name: string;
  scorePercentage: number;
}

export interface AssessmentResult {
  assessmentId: string;
  scorePercentage: number;
  scorePoints: number;
  maxPoints: number;
  timeSpentSeconds: number;
  classPerformance: ClassPerformance;
  topicPerformances: TopicPerformance[];
}
