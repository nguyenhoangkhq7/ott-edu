'use client';

import React, { useMemo } from 'react';

interface StudentSubmissionStatusTableProps {
  assignment: {
    title: string;
    dueDate: string;
    maxScore: number;
  };
  submission: {
    id: number;
    status: string;
    fileUrl?: string;
    submittedAt: string;
    gradedAt?: string;
    score?: number;
    feedback?: string;
  };
}

/**
 * Moodle-like Student Submission Status Table
 * Displays 6 key information rows about the submission
 */
export default function StudentSubmissionStatusTable({
  assignment,
  submission,
}: StudentSubmissionStatusTableProps) {
  const statusInfo = useMemo(() => {
    const dueDate = new Date(assignment.dueDate);
    const submittedAt = new Date(submission.submittedAt);

    // Calculate time difference
    const timeDiff = submittedAt.getTime() - dueDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));

    let timeRemainingText = '';
    let isLate = false;

    if (timeDiff < 0) {
      // Early submission
      const absDays = Math.abs(daysDiff);
      if (absDays >= 1) {
        timeRemainingText = `Nộp sớm ${absDays} ngày`;
      } else {
        const absHours = Math.abs(hoursDiff);
        timeRemainingText = `Nộp sớm ${absHours} giờ`;
      }
    } else {
      // Late submission
      isLate = true;
      const absDays = Math.abs(daysDiff);
      if (absDays >= 1) {
        timeRemainingText = `Nộp muộn ${absDays} ngày`;
      } else {
        const absHours = Math.abs(hoursDiff);
        timeRemainingText = `Nộp muộn ${absHours} giờ`;
      }
    }

    // Format submitted date
    const formattedSubmittedAt = submittedAt.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Grading status
    const isGraded = submission.gradedAt && submission.score !== undefined;

    return {
      timeRemainingText,
      isLate,
      formattedSubmittedAt,
      isGraded,
    };
  }, [assignment.dueDate, submission.submittedAt, submission.gradedAt, submission.score]);

  const getFileName = (url?: string) => {
    if (!url) return 'Tập tin';
    try {
      return url.split('/').pop() || 'Tập tin đã nộp';
    } catch {
      return 'Tập tin đã nộp';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Trạng thái bài nộp</h3>

      {/* Status Table Rows */}
      <div className="space-y-4">
        {/* Row 1: Submission Status */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Trạng thái bài nộp</p>
            <p className="text-xs text-slate-500 mt-1">Status của bài nộp</p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Đã nộp để chấm điểm
            </span>
          </div>
        </div>

        {/* Row 2: Grading Status */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Trạng thái chấm điểm</p>
            <p className="text-xs text-slate-500 mt-1">Xem giáo viên đã chấm chưa</p>
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              statusInfo.isGraded
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H5a1 1 0 000 2h10a1 1 0 100-2h-1a1 1 0 000-2 2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2H4z" clipRule="evenodd" />
              </svg>
              {statusInfo.isGraded ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
            </span>
          </div>
        </div>

        {/* Row 3: Time Remaining */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Thời gian nộp</p>
            <p className="text-xs text-slate-500 mt-1">So với hạn nộp dự kiến</p>
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              statusInfo.isLate
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              {statusInfo.timeRemainingText}
            </span>
          </div>
        </div>

        {/* Row 4: Last Modified */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Chỉnh sửa lần cuối</p>
            <p className="text-xs text-slate-500 mt-1">Lần cuối cập nhật bài nộp</p>
          </div>
          <div className="flex-shrink-0">
            <p className="text-sm text-slate-700 font-medium">
              {statusInfo.formattedSubmittedAt}
            </p>
          </div>
        </div>

        {/* Row 5: File Submission */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Nộp tập tin</p>
            <p className="text-xs text-slate-500 mt-1">Tập tin được nộp</p>
          </div>
          <div className="flex-shrink-0">
            {submission.fileUrl ? (
              <a
                href={submission.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {getFileName(submission.fileUrl)}
              </a>
            ) : (
              <span className="text-slate-500 text-sm italic">Chưa có tập tin</span>
            )}
          </div>
        </div>

        {/* Row 6: Feedback */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Bình luận / Nhận xét</p>
            <p className="text-xs text-slate-500 mt-1">Nhận xét từ giáo viên</p>
          </div>
          <div className="flex-shrink-0 max-w-xs text-right">
            {statusInfo.isGraded ? (
              <div className="space-y-2">
                <div className="inline-block">
                  <p className="text-2xl font-bold text-blue-600">
                    {submission.score}
                    <span className="text-lg text-slate-600">/
{assignment.maxScore}</span>
                  </p>
                </div>
                {submission.feedback && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mt-2 text-left">
                    <p className="font-semibold text-slate-700 mb-1">Nhận xét:</p>
                    <p className="whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Đang chờ chấm điểm...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
