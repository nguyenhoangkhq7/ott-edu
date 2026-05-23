'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { submissionApi, assignmentApi } from '@/services/api/assignment.service';
import { teamApi } from '@/services/api/teamApi';
import { formatDisplayFileName } from '@/shared/utils/file';

interface TeacherGradingDashboardProps {
  assignmentId: number;
  maxScore: number;
  onGradeSuccess?: () => void;
}

/**
 * Submission shape returned by the backend (SubmissionGradingListDto).
 * NOTE: The backend returns ONLY studentAccountId — no student name.
 * Per the backend comment: "Frontend/BFF will aggregate with core-service for student names."
 * We log the raw payload so developers can see all available fields.
 */
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
  // File attachment — backend field name is `fileUrl`
  fileUrl?: string;
  attachmentUrl?: string;
  // Broad fallback: any extra fields the backend might add in the future
  [key: string]: unknown;
}

/**
 * Resolve the best available student display name.
 * The backend currently only exposes studentAccountId (microservice boundary).
 * We try every possible field name so it works when the backend is enriched.
 */
function resolveStudentName(submission: PendingSubmission, studentNamesMap?: Record<number, string>): string {
  if (studentNamesMap && studentNamesMap[submission.studentAccountId]) {
    return studentNamesMap[submission.studentAccountId];
  }

  // Attempt every known / possible field path
  const name =
    (submission.studentName as string | undefined) ||
    (submission.studentFullName as string | undefined) ||
    ((submission.student as { fullName?: string; name?: string } | undefined)?.fullName) ||
    ((submission.student as { fullName?: string; name?: string } | undefined)?.name) ||
    ((submission.user as { fullName?: string; username?: string; name?: string } | undefined)?.fullName) ||
    ((submission.user as { fullName?: string; username?: string; name?: string } | undefined)?.username) ||
    ((submission.user as { fullName?: string; username?: string; name?: string } | undefined)?.name) ||
    ((submission.author as { fullName?: string; name?: string } | undefined)?.fullName) ||
    ((submission.author as { fullName?: string; name?: string } | undefined)?.name) ||
    ((submission.account as { fullName?: string; username?: string } | undefined)?.fullName) ||
    ((submission.account as { fullName?: string; username?: string } | undefined)?.username);

  return name || `Học sinh #${submission.studentAccountId}`;
}

/** Resolve the download URL — use exactly what backend provides, no reconstruction */
function resolveFileUrl(submission: PendingSubmission): string | undefined {
  return (
    (submission.fileUrl as string | undefined) ||
    (submission.attachmentUrl as string | undefined) ||
    undefined
  );
}

/** Programmatic force-download via Blob to avoid S3 NoSuchKey XML error pages */
async function forceDownload(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch {
    // If blob download fails (e.g. CORS), fall back to opening in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

type GradingTab = 'PENDING' | 'GRADED';

/**
 * Professional Teacher Grading Dashboard
 * Fixes:
 * - Issue 2: Force-download via Blob (avoids S3 XML error)
 * - Issue 3: Broad student name resolution + console.log for debugging
 * - Issue 4: Tabs ALWAYS visible regardless of submission count
 */
export default function TeacherGradingDashboard({
  assignmentId,
  maxScore,
  onGradeSuccess,
}: TeacherGradingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [allSubmissions, setAllSubmissions] = useState<PendingSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<GradingTab>('PENDING');
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);
  const [score, setScore] = useState<number | string>('');
  const [feedback, setFeedback] = useState('');
  const [studentNamesMap, setStudentNamesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchStudentNames = async () => {
      try {
        const detail = await assignmentApi.getDetail(assignmentId);
        if (detail && detail.teamIds && detail.teamIds.length > 0) {
          const namesMap: Record<number, string> = {};

          await Promise.all(
            detail.teamIds.map(async (teamId) => {
              try {
                const members = await teamApi.getMembers(teamId);
                if (Array.isArray(members)) {
                  members.forEach((member) => {
                    const fullName = `${member.lastName || ''} ${member.firstName || ''}`.trim();
                    if (fullName) {
                      namesMap[member.accountId] = fullName;
                    }
                  });
                }
              } catch (err) {
                console.error(`[GradingDashboard] Error fetching members for team ${teamId}:`, err);
              }
            })
          );

          setStudentNamesMap(namesMap);
        }
      } catch (err) {
        console.error('[GradingDashboard] Error fetching assignment details for student names:', err);
      }
    };

    void fetchStudentNames();
  }, [assignmentId]);

  const loadAllSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await submissionApi.getAllSubmissions(assignmentId);

      let submissionsArray: PendingSubmission[] = [];
      if (Array.isArray(response)) {
        submissionsArray = response as PendingSubmission[];
      } else if (response && typeof response === 'object') {
        const pageResponse = response as { content?: PendingSubmission[] };
        submissionsArray = Array.isArray(pageResponse.content) ? pageResponse.content : [];
      }

      // ── DEBUG: log every raw submission object so we can see real field names ──
      if (submissionsArray.length > 0) {
        console.log('[GradingDashboard] Raw submission payload (first item):', submissionsArray[0]);
        console.log('[GradingDashboard] All submission payloads:', submissionsArray);
      } else {
        console.log('[GradingDashboard] No submissions returned from API');
      }

      setAllSubmissions(submissionsArray);

      const firstPending = submissionsArray.find((s) => s.status !== 'GRADED');
      if (firstPending) {
        setSelectedSubmission(firstPending);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể tải bài nộp');
      console.error('[GradingDashboard] Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadAllSubmissions();
  }, [loadAllSubmissions]);

  const pendingSubmissions = allSubmissions.filter((s) => s.status !== 'GRADED');
  const gradedSubmissions = allSubmissions.filter((s) => s.status === 'GRADED');
  const displayedSubmissions = activeTab === 'PENDING' ? pendingSubmissions : gradedSubmissions;

  const handleSelectSubmission = (submission: PendingSubmission) => {
    console.log('[GradingDashboard] Selected submission:', submission);
    setSelectedSubmission(submission);
    setScore('');
    setFeedback('');
    setSuccess(null);
    setError(null);
  };

  const handleTabChange = (tab: GradingTab) => {
    setActiveTab(tab);
    setSelectedSubmission(null);
    setScore('');
    setFeedback('');
    setSuccess(null);
    setError(null);
  };

  const handleDownloadFile = async (submission: PendingSubmission) => {
    const url = resolveFileUrl(submission);
    if (!url) return;
    setDownloading(true);
    try {
      const filename = getFileName(url);
      await forceDownload(url, filename);
    } finally {
      setDownloading(false);
    }
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
      setTimeout(() => {
        void loadAllSubmissions();
        setScore('');
        setFeedback('');
        setSelectedSubmission(null);
      }, 1000);

      if (onGradeSuccess) onGradeSuccess();
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
    return formatDisplayFileName(url, 'file');
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
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-blue-700 font-medium">Tổng bài nộp</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{allSubmissions.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Chưa chấm</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{pendingSubmissions.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Đã chấm</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{gradedSubmissions.length}</p>
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

      {/*
        ── FIX Issue 4: Tabs are ALWAYS rendered outside any conditional block ──
        The grid/form is shown unconditionally; the submission list simply shows
        an empty-state message when its filtered array is empty.
      */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Tabs + Submission List */}
        <div className="col-span-1 bg-white rounded-lg border border-slate-200 overflow-hidden">

          {/* Tabs — always visible */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => handleTabChange('PENDING')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'PENDING'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                }`}
            >
              Chưa chấm ({pendingSubmissions.length})
            </button>
            <button
              onClick={() => handleTabChange('GRADED')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'GRADED'
                  ? 'bg-white text-green-700 border-b-2 border-green-600'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                }`}
            >
              Đã chấm ({gradedSubmissions.length})
            </button>
          </div>

          {/* Submission list */}
          <div className="max-h-[500px] overflow-y-auto">
            {displayedSubmissions.length === 0 ? (
              <div className="py-10 px-4 text-center text-slate-500 text-sm">
                {activeTab === 'PENDING'
                  ? 'Không có bài chưa chấm'
                  : 'Chưa có bài nào được chấm'}
              </div>
            ) : (
              displayedSubmissions.map((submission) => (
                <button
                  key={submission.submissionId}
                  onClick={() => handleSelectSubmission(submission)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-blue-50 transition-colors ${selectedSubmission?.submissionId === submission.submissionId
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : ''
                    }`}
                >
                  {/* FIX Issue 3: resolveStudentName checks every known field */}
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {resolveStudentName(submission, studentNamesMap)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {getFormattedDate(submission.submittedAt)}
                  </p>
                  {submission.status === 'GRADED' && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                        Đã chấm
                      </span>
                      {submission.currentScore !== undefined && submission.currentScore !== null && (
                        <span className="text-xs text-slate-600 font-medium">
                          {submission.currentScore}/{maxScore}
                        </span>
                      )}
                    </div>
                  )}
                  {submission.isLate && (
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                      Nộp muộn
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Grading Form */}
        <div className="col-span-2">
          {selectedSubmission ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
              {/* Student Info */}
              <div className="pb-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {activeTab === 'GRADED' ? 'Chi tiết bài đã chấm:' : 'Chấm bài:'}{' '}
                  {resolveStudentName(selectedSubmission, studentNamesMap)}
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-slate-600">Mã học sinh:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      #{selectedSubmission.studentAccountId}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-600">Ngày nộp:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {getFormattedDate(selectedSubmission.submittedAt)}
                    </span>
                  </p>
                  {selectedSubmission.status === 'GRADED' && selectedSubmission.currentScore !== undefined && (
                    <p>
                      <span className="text-slate-600">Điểm đã chấm:</span>
                      <span className="ml-2 font-semibold text-green-700">
                        {selectedSubmission.currentScore}/{maxScore}
                      </span>
                    </p>
                  )}

                  {/* FIX Issue 2: Force-download button instead of href link */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Tập tin:</span>
                    {resolveFileUrl(selectedSubmission) ? (
                      <button
                        onClick={() => handleDownloadFile(selectedSubmission)}
                        disabled={downloading}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Tải xuống tập tin bài nộp"
                      >
                        {downloading ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        {downloading ? 'Đang tải...' : getFileName(resolveFileUrl(selectedSubmission))}
                      </button>
                    ) : (
                      <span className="text-slate-500">Không có tập tin</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score + Feedback (only for pending) */}
              {activeTab === 'PENDING' && (
                <>
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
                </>
              )}

              {activeTab === 'GRADED' && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm">
                  <p className="font-semibold text-green-800 mb-1">Bài đã được chấm điểm</p>
                  <p className="text-slate-600">
                    Xem lại thông tin bài nộp ở trên. Để chỉnh sửa điểm, vui lòng liên hệ quản trị viên.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500">Chọn bài nộp để bắt đầu chấm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
