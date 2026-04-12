'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentDetail, useSubmission, useTimer } from '@/shared/hooks/useQuiz';
import { QuestionCard } from '@/shared/components/quiz/QuestionCard';
import { QuizTimer } from '@/shared/components/quiz/QuizTimer';
import styles from './page.module.css';
import { AssignmentDetail } from '@/shared/types/quiz';



export default function AssignmentTakePage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params.id as string, 10);
  const submissionId = parseInt(params.submissionId as string, 10);

  const { assignment, loading: assignmentLoading } = useAssignmentDetail(assignmentId);
  const assignmentData = assignment as AssignmentDetail | undefined;

  const { submitAssignment } = useSubmission();
  const { timeRemaining, start: startTimer, isTimeUp } = useTimer(
    assignmentData?.timeLimit || 60
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: number[]}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load submission
  useEffect(() => {
    if (!submissionId || !assignment) return;
    // Start timing
    startTimer();
  }, [submissionId, assignment, startTimer]);

  const handleAnswerChange = (questionId: number, selectedIds: number[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedIds,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (!submissionId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitAssignment(submissionId);
      const res = result as unknown as { id: number };
      router.push(`/assignments/${assignmentId}/results?submissionId=${res.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment');
      setIsSubmitting(false);
    }
  }, [assignmentId, router, submitAssignment, submissionId]);

  // Auto-submit when time is up
  useEffect(() => {
    if (!isTimeUp || !submissionId || isSubmitting) return;
    
    const timer = setTimeout(() => {
      handleSubmit();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [isTimeUp, submissionId, isSubmitting, handleSubmit]);

  if (assignmentLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Assignment not found</h2>
        </div>
      </div>
    );
  }

  const questions = assignmentData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{assignmentData?.title}</h1>
          <p className={styles.breadcrumb}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <QuizTimer {...({ 
          timeRemainingSeconds: timeRemaining, 
          timeLimit: assignmentData?.timeLimit || 60 
        } as unknown as { timeRemainingSeconds: number; timeLimit: number })} />
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressText}>
          {answeredCount} of {questions.length} answered
        </p>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.content}>
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion as MinimalQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            answers={answers}
            onChange={handleAnswerChange}
          />
        )}
      </div>

      <div className={styles.navigationBar}>
        <button
          className={styles.navButton}
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          ← Previous
        </button>

        <div className={styles.questionIndicators}>
          {questions.map((q, idx: number) => {
            const question = q as MinimalQuestion;
            return (
              <button
                key={question.id}
                className={`${styles.indicator} ${
                  idx === currentQuestionIndex ? styles.active : ''
                } ${answers[question.id] !== undefined ? styles.answered : ''}`}
                onClick={() => setCurrentQuestionIndex(idx)}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        ) : (
          <button
            className={styles.navButton}
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
