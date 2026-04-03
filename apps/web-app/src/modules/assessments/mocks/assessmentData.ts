import { Assessment, ExamSession, AssessmentResult } from '../types/assessment';

export const mockAssessments: Assessment[] = [
  {
    id: 'a1',
    title: 'Midterm Calculus',
    subject: 'Mathematics',
    description: 'Derivatives, Integrals and their applications in real-world scenarios.',
    status: 'AVAILABLE',
    dueDate: 'Oct 24, 2023',
    durationMinutes: 90,
    totalQuestions: 20
  },
  {
    id: 'a2',
    title: 'Intro to Pedagogy',
    subject: 'Education',
    description: 'Foundational theories and classroom management techniques.',
    status: 'COMPLETED',
    dueDate: 'Oct 15, 2023',
    submittedDate: 'Oct 18, 2023',
    score: 94,
    maxScore: 100,
    durationMinutes: 60,
    totalQuestions: 30
  },
  {
    id: 'a3',
    title: 'Weekly Quiz 4',
    subject: 'Module 4',
    description: 'Assessment of Module 4 reading materials and lectures.',
    status: 'OVERDUE',
    dueDate: 'Oct 20, 2023',
    durationMinutes: 15,
    totalQuestions: 10
  },
  {
    id: 'a4',
    title: 'Literature Review',
    subject: 'English',
    description: 'Analysis of 19th-century educational philosophies.',
    status: 'AVAILABLE',
    dueDate: 'Oct 28, 2023',
    durationMinutes: 45,
    totalQuestions: 15
  }
];

export const mockExamSession: ExamSession = {
  assessmentId: 'a1',
  timeRemainingSeconds: 42 * 60 + 15, // 42:15
  questions: [
    {
      id: 'q12',
      text: 'Which of the following best describes the "Zone of Proximal Development" in modern educational psychology frameworks?',
      points: 5,
      options: [
        { id: 'optA', label: 'A', content: 'The distance between what a learner can do without help and what they can achieve with guidance.' },
        { id: 'optB', label: 'B', content: 'The physical classroom environment that facilitates peer-to-peer interaction and social learning.' },
        { id: 'optC', label: 'C', content: 'The cognitive limit of a student\'s ability to retain abstract information over long durations.' },
        { id: 'optD', label: 'D', content: 'The transitional phase between primary education and specialized secondary vocational training.' }
      ]
    }
  ]
};

export const mockAssessmentResult: AssessmentResult = {
  assessmentId: 'a1',
  scorePercentage: 90,
  scorePoints: 18,
  maxPoints: 20,
  timeSpentSeconds: 24 * 60 + 12,
  classPerformance: {
    averageScorePercentage: 72,
    userScorePercentage: 90,
    userRank: 4,
    totalStudents: 128
  },
  topicPerformances: [
    { name: 'Theoretical Understanding', scorePercentage: 95 },
    { name: 'Case Study Analysis', scorePercentage: 85 },
    { name: 'Pedagogical Frameworks', scorePercentage: 60 }
  ]
};
