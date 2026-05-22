'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { submissionApi } from '@/services/api/assignment.service';

interface TeacherGradingDashboardProps {
  assignmentId: number;
  maxScore: number;
  onGradeSuccess?: () => void;
}

interface PendingSubmission {
  submissionId: number;
  studentAccountId: number;
  assignmentId: number;
  status: string;
  submittedAt: string;
  isLate: boolean;
  isGraded: boolean;
  currentScore?: number;
  gradeRevision?: number;
  // Optional fields (may not be in all responses)
  studentName?: string;
  fileUrl?: string;
}

/**
 * Professional Teacher Grading Dashboard (Moodle-inspired)
 * Displays summary stats, pending submissions list, and grading form
 */
export default function TeacherGradingDashboard({
  assignmentId,
  maxScore,
  onGradeSuccess,
}: TeacherGradingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pending submissions
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);

  // Selected submission for grading
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);

  // Grading form
  const [score, setScore] = useState<number | string>('');
  const [feedback, setFeedback] = useState('');

  const loadPendingSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await submissionApi.getPendingSubmissions(assignmentId);

      // Handle paginated response (Spring Page object or direct array)
      let submissionsArray: PendingSubmission[] = [];

      if (Array.isArray(response)) {
        // Direct array response
        submissionsArray = response as PendingSubmission[];
      } else if (response && typeof response === 'object') {
        // Paginated response with content property
        const pageResponse = response as { content?: PendingSubmission[] };
        submissionsArray = Array.isArray(pageResponse.content) ? pageResponse.content : [];
      }

      setPendingSubmissions(submissionsArray);

      if (submissionsArray && submissionsArray.length > 0) {
        setSelectedSubmission(submissionsArray[0]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể tải bài nộp');
      console.error('Error loading pending submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadPendingSubmissions();
  }, [loadPendingSubmissions]);

  const handleSelectSubmission = (submission: PendingSubmission) => {
    setSelectedSubmission(submission);
    setScore('');
    setFeedback('');
    setSuccess(null);
    setError(null);
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) {
      setError('Vui lòng chọn bài nộp');
      return;
    }

    if (score === '' || score === null) {
      setError('Vui lòng nhập điểm');
      return;
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > maxScore) {
      setError(`Điểm phải từ 0 đến ${maxScore}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await submissionApi.gradeSubmission(selectedSubmission.submissionId, {
        score: numScore,
        feedback: feedback || '',
      });

      setSuccess('Lưu điểm thành công!');

      // Reload pending submissions
      setTimeout(() => {
        loadPendingSubmissions();
        setScore('');
        setFeedback('');
        setSelectedSubmission(null);
      }, 1000);

      if (onGradeSuccess) {
        onGradeSuccess();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Lưu điểm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileName = (url?: string) => {
    if (!url) return 'Tập tin';
    try {
      return url.split('/').pop() || 'Tập tin';
    } catch {
      return 'Tập tin';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Đang tải bài nộp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-700 font-medium">Tổng bài nộp</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{pendingSubmissions.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Chưa chấm</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">
              {pendingSubmissions.filter(s => s.status !== 'GRADED').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Điểm tối đa</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{maxScore}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {pendingSubmissions.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-700 font-medium">Không có bài nộp</p>
          <p className="text-slate-500 text-sm mt-1">Tất cả bài tập đã được chấm</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Pending Submissions List */}
          <div className="col-span-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 text-sm">
                Bài chưa chấm ({pendingSubmissions.filter(s => s.status !== 'GRADED').length})
              </h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {pendingSubmissions.map((submission) => (
                <button
                  key={submission.submissionId}
                  onClick={() => handleSelectSubmission(submission)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-blue-50 transition-colors ${selectedSubmission?.submissionId === submission.submissionId
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : ''
                    }`}
                >
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {submission.studentName || `Học sinh #${submission.studentAccountId}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {getFormattedDate(submission.submittedAt)}
                  </p>
                  {submission.status === 'GRADED' && (
                    <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                      Đã chấm
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grading Form */}
          <div className="col-span-2">
            {selectedSubmission ? (
              <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
                {/* Selected Student Info */}
                <div className="pb-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Chấm bài: {selectedSubmission.studentName || `Học sinh #${selectedSubmission.studentAccountId}`}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-600">Ngày nộp:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {getFormattedDate(selectedSubmission.submittedAt)}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-slate-600">Tập tin:</span>
                      {selectedSubmission.fileUrl ? (
                        <a
                          href={selectedSubmission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {getFileName(selectedSubmission.fileUrl)}
                        </a>
                      ) : (
                        <span className="text-slate-500">Không có tập tin</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Score Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Điểm số (0-{maxScore}) *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="Nhập điểm"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 font-medium">/ {maxScore}</span>
                  </div>
                  {score !== '' && (
                    <p className="mt-2 text-xs text-slate-500">
                      Tỉ lệ: {((Number(score) / maxScore) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Nhận xét / Bình luận (Tùy chọn)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét cho học sinh..."
                    rows={5}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {feedback.length} / 1000 ký tự
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSubmitGrade}
                  disabled={submitting || score === ''}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${submitting || score === ''
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu điểm
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <p className="text-slate-500">Chọn bài nộp để bắt đầu chấm</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
