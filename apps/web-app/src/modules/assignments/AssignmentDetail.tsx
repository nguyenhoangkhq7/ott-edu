'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/providers/AuthProvider';
import { assignmentApi, submissionApi } from '@/services/api/assignment.service';
import { AttemptHistory, AttemptStatus } from '@/shared/types/assignment';
import { AssignmentDetail as AssignmentDetailType, AssignmentType } from '@/shared/types/quiz';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';
import TeacherGradingDashboard from './components/TeacherGradingDashboard';
import EssaySubmissionZone from './components/EssaySubmissionZone';
import StudentSubmissionStatusTable from './components/StudentSubmissionStatusTable';
import { formatDisplayFileName } from '@/shared/utils/file';

interface AssignmentDetailProps {
  assignmentId: number;
  onClose?: () => void;
  onRefresh?: () => void;
}

interface StudentSubmission {
  id: number;
  status: string;
  fileUrl: string;
  submittedAt: string;
  gradedAt?: string;
  score?: number;
  feedback?: string;
}

export default function AssignmentDetail({
  assignmentId,
  onClose,
  onRefresh,
}: AssignmentDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isTeacher = user?.roles?.includes('ROLE_TEACHER') ?? false;
  const [assignment, setAssignment] = useState<AssignmentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // STUDENT-specific state
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([]);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);

  // Feature 1: Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Feature 4: Refresh submission for post-submit status table
  const [refreshSubmission, setRefreshSubmission] = useState(false);

  const initializeOrFetchSubmission = useCallback(async (assignmentId: number) => {
    try {
      // Try to fetch current submission first
      const submission = await submissionApi.getCurrentSubmission(assignmentId) as StudentSubmission | null;

      if (submission) {
        setCurrentSubmission(submission);
      } else {
        // If no submission exists, auto-initialize one
        const initialized = await submissionApi.startAssignment(assignmentId) as StudentSubmission;
        if (initialized && initialized.id) {
          setCurrentSubmission(initialized);
        }
      }
    } catch (err: unknown) {
      console.warn('Could not initialize submission:', err);
      // Don't block user if initialization fails - they can still submit
    }
  }, []);

  const loadAssignmentDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const detail = await assignmentApi.getDetail(assignmentId);
      setAssignment(detail);

      // If STUDENT and QUIZ, load attempt history and check if can attempt
      if (!isTeacher && detail.type === AssignmentType.QUIZ) {
        const [history, status] = await Promise.all([
          submissionApi.getAttemptHistory(assignmentId),
          submissionApi.canAttempt(assignmentId),
        ]);
        setAttemptHistory(history);
        setAttemptStatus(status);
      }

      // If STUDENT and ESSAY, initialize or fetch submission
      if (!isTeacher && detail.type === AssignmentType.ESSAY) {
        await initializeOrFetchSubmission(assignmentId);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, initializeOrFetchSubmission, isTeacher]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAssignmentDetail();
    });
  }, [loadAssignmentDetail, refreshSubmission]);

  // Feature 5: Poll for grade updates (student waiting for teacher grading)
  useEffect(() => {
    if (!currentSubmission || isTeacher || currentSubmission.status !== 'SUBMITTED') {
      return;
    }

    // Poll every 5 seconds to check if teacher has graded
    const pollInterval = setInterval(async () => {
      try {
        const updated = await submissionApi.getCurrentSubmission(assignmentId) as StudentSubmission | null;
        if (updated) {
          setCurrentSubmission(updated);
          // Stop polling once graded
          if (updated.score !== undefined && updated.score !== null) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling for grade updates:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentSubmission, assignmentId, isTeacher]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatScore = (score?: number, maxScore?: number) => {
    if (score === undefined || score === null) {
      return 'Chưa chấm';
    }
    return maxScore ? `${score}/${maxScore}` : score.toString();
  };

  // Transform submission data for StudentSubmissionStatusTable (flatten grade object)
  const getSubmissionForDisplay = () => {
    if (!currentSubmission) return null;
    return {
      id: currentSubmission.id,
      status: currentSubmission.status,
      fileUrl: currentSubmission.fileUrl || '',
      submittedAt: currentSubmission.submittedAt,
      gradedAt: (currentSubmission as unknown as { grade?: { gradedAt?: string } })?.grade?.gradedAt,
      score: (currentSubmission as unknown as { grade?: { score?: number } })?.grade?.score,
      feedback: (currentSubmission as unknown as { grade?: { feedback?: string } })?.grade?.feedback,
    };
  };

  const isDueDate = assignment ? new Date(assignment.dueDate) <= new Date() : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error || 'Assignment not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hạn nộp: {new Date(assignment.dueDate).toLocaleString('vi-VN')}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Điểm: {assignment.maxScore}
              </span>
              {assignment.type === AssignmentType.QUIZ && assignment.timeLimit && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thời gian làm bài: {assignment.timeLimit} phút
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.type === AssignmentType.QUIZ
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
                }`}>
                {assignment.type === AssignmentType.QUIZ ? 'Trắc nghiệm' : 'Luận'}
              </span>
              {isDueDate && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  Quá hạn
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTeacher && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa bài tập"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {/* {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )} */}
          </div>
        </div>

        {/* Instructions */}
        <div className="prose prose-sm max-w-none">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Hướng dẫn</h3>
          <p className="text-slate-700 whitespace-pre-wrap">{assignment.instructions}</p>
        </div>
      </div>

      {/* TEACHER View */}
      {isTeacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Thông tin từ giáo viên
          </h3>
          <div className="space-y-2 text-sm text-blue-900">
            {assignment.type === AssignmentType.QUIZ && assignment.maxAttempts && (
              <p>Số lần làm tối đa: <strong>{assignment.maxAttempts}</strong></p>
            )}
            {assignment.materialUrls && assignment.materialUrls.length > 0 && (
              <div>
                <p className="font-medium mb-2">Tài liệu tham khảo ({assignment.materialUrls.length}):</p>
                <ul className="space-y-1 ml-4">
                  {assignment.materialUrls.map((url, idx) => (
                    <li key={idx}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 hover:underline">
                        {formatDisplayFileName(url)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHER Grading Dashboard */}
      {isTeacher && assignment.type === AssignmentType.ESSAY && (
        <TeacherGradingDashboard
          assignmentId={assignmentId}
          maxScore={assignment.maxScore || 0}
          onGradeSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* STUDENT View */}
      {!isTeacher && (
        <>
          {/* Materials for ESSAY */}
          {assignment.type === AssignmentType.ESSAY && assignment.materialUrls && assignment.materialUrls.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tài liệu tham khảo</h3>
              <div className="space-y-2">
                {assignment.materialUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {formatDisplayFileName(url)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* QUIZ Attempt History */}
          {assignment.type === AssignmentType.QUIZ && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Lịch sử làm bài</h3>
                {attemptStatus && !attemptStatus.canAttempt && (
                  <span className="text-xs font-semibold px-3 py-1 bg-red-100 text-red-700 rounded-full">
                    Hết lần làm
                  </span>
                )}
              </div>

              {/* Start Quiz Button */}
              {attemptStatus?.canAttempt && (
                <button
                  onClick={() => router.push(`/assignments/${assignmentId}/quiz`)}
                  disabled={isDueDate}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mb-6 ${isDueDate
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isDueDate ? 'Quá hạn nộp' : 'Bắt đầu làm bài'}
                </button>
              )}

              {/* Attempt History Table */}
              {attemptHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Lần làm</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Ngày nộp</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Điểm</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Trạng thái</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attemptHistory.map((attempt) => (
                        <tr key={attempt.submissionId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{attempt.attemptNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(attempt.submittedAt)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatScore(attempt.score, attempt.maxScore)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${attempt.status === 'GRADED'
                              ? 'bg-green-100 text-green-700'
                              : attempt.status === 'SUBMITTED'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                              }`}>
                              {attempt.status === 'GRADED' ? 'Đã chấm' : attempt.status === 'SUBMITTED' ? 'Đã nộp' : 'Nháp'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{attempt.feedback || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500">Chưa có lần nộp nào</p>
                </div>
              )}
            </div>
          )}

          {/* ESSAY Submission */}
          {assignment.type === AssignmentType.ESSAY && (
            <>
              {/* Show submission status table if already submitted or graded */}
              {currentSubmission && (currentSubmission.status === 'SUBMITTED' || currentSubmission.status === 'GRADED') ? (
                <StudentSubmissionStatusTable
                  assignment={assignment}
                  submission={getSubmissionForDisplay()!}
                />
              ) : (
                // Show upload zone if not yet submitted
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Nộp bài</h3>
                  <EssaySubmissionZone
                    submissionId={currentSubmission?.id}
                    assignmentId={assignmentId}
                    isDueDate={isDueDate}
                    onSubmitSuccess={() => {
                      setRefreshSubmission((prev) => !prev);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        assignmentTitle={assignment?.title || ''}
        assignmentId={assignmentId}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (onRefresh) onRefresh();
          if (onClose) onClose();
        }}
      />
    </div>
  );
}
