'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAssignmentDetail, useSubmission } from '@/shared/hooks/useQuiz';
import { Submission, SubmissionStatus } from '@/shared/types/quiz';
import styles from './page.module.css';

export default function AssignmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = parseInt(params.id as string, 10);
  const submissionId = parseInt(searchParams.get('submissionId') || '0', 10);

  const { assignment, loading: assignmentLoading } = useAssignmentDetail(assignmentId);
  const { submission, getSubmission, loading: submissionLoading } = useSubmission();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (submissionId) {
          await getSubmission(submissionId);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [submissionId, getSubmission]);

  if (isLoading || assignmentLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Results not found</h2>
        </div>
      </div>
    );
  }

  const percentage = submission.grade ? (submission.grade.score / assignment.totalPoints) * 100 : 0;
  
  const getGrade = (pct: number) => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return styles.excellent;
    if (pct >= 60) return styles.good;
    if (pct >= 40) return styles.fair;
    return styles.poor;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const correctAnswers = submission.answers?.filter((a) => a.isCorrect).length || 0;
  const totalQuestions = assignment.questions?.length || 0;

  return (
    <div className={styles.container}>
      <div className={styles.resultsCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>✅ Assignment Submitted!</h1>
          <p className={styles.subtitle}>{assignment.title}</p>
        </div>

        <div className={`${styles.scoreSection} ${getScoreColor(percentage)}`}>
          <div className={styles.scoreDisplay}>
            <div className={styles.scoreCircle}>
              <div className={styles.scoreValue}>{Math.round(percentage)}<span className={styles.percent}>%</span></div>
              <div className={styles.scoreGrade}>{getGrade(percentage)}</div>
            </div>
            <div className={styles.scoreInfo}>
              <h2>Your Score</h2>
              <p className={styles.scoreText}>
                {submission.grade?.score?.toFixed(1) || '0'} / {assignment.totalPoints} points
              </p>
              <p className={styles.answersText}>
                {correctAnswers} of {totalQuestions} correct
              </p>
            </div>
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={`${styles.infoValue} ${styles[submission.status.toLowerCase()]}`}>
              {submission.status}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Submitted</span>
            <span className={styles.infoValue}>
              {submission.submittedAt ? formatDate(submission.submittedAt) : 'Not submitted'}
            </span>
          </div>
          {submission.grade && (
            <>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Graded</span>
                <span className={styles.infoValue}>
                  {submission.grade.gradedAt ? formatDate(submission.grade.gradedAt) : 'Pending'}
                </span>
              </div>
              {submission.grade.comment && (
                <div className={styles.infoItem + ' ' + styles.fullWidth}>
                  <span className={styles.infoLabel}>Feedback</span>
                  <span className={styles.infoValue + ' ' + styles.comment}>
                    {submission.grade.comment}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/assignments')}
          >
            Back to Assignments
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => router.push(`/assignments?teamId=1`)}
          >
            View All Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
