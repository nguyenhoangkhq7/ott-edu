'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentDetail, useSubmission } from '@/shared/hooks/useQuiz';
import styles from './page.module.css';

export default function StartAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params.id as string, 10);

  const { assignment, loading } = useAssignmentDetail(assignmentId);
  const { startAssignment, loading: submissionLoading } = useSubmission();

  const handleStartClick = async () => {
    try {
      const submission = await startAssignment(assignmentId);
      router.push(`/assignments/${assignmentId}/take?submissionId=${submission.id}`);
    } catch (error) {
      console.error('Failed to start assignment:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
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

  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();

  return (
    <div className={styles.container}>
      <div className={styles.startScreen}>
        <div className={styles.startCard}>
          <div className={styles.badge}>Assessment Portal</div>
          <h1 className={styles.title}>{assignment.title}</h1>

          <div className={styles.instructionsSection}>
            <h3>Instructions</h3>
            <p className={styles.instructions}>{assignment.instructions}</p>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>📝 Total Questions</span>
              <span className={styles.detailValue}>{assignment.questions?.length || 0}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>⭐ Total Points</span>
              <span className={styles.detailValue}>{assignment.maxScore}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>📅 Due Date</span>
              <span className={`${styles.detailValue} ${isOverdue ? styles.overdue : ''}`}>
                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {isOverdue && (
            <div className={styles.overdueWarning}>
              ⚠️ This assignment is overdue. Submission may not count towards your grade.
            </div>
          )}

          <div className={styles.infoBox}>
            <h4>Important Notes</h4>
            <ul>
              <li>Once you start, you will complete the assignment</li>
              <li>The timer will start counting down automatically</li>
              <li>You can navigate between questions using Previous/Next or by clicking question numbers</li>
              <li>Your progress is automatically saved as you answer questions</li>
              <li>You cannot leave the assignment without submitting</li>
              <li>Once submitted, you cannot edit your answers</li>
            </ul>
          </div>

          <button
            className={styles.startBtn}
            onClick={handleStartClick}
            disabled={submissionLoading}
          >
            {submissionLoading ? 'Starting...' : 'Start Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
