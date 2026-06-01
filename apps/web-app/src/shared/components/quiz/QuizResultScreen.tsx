'use client';

import React from 'react';
import { SubmissionResult } from '@/shared/types/quiz';
import { useRouter } from 'next/navigation';

interface QuizResultScreenProps {
  result: SubmissionResult;
  assignmentTitle: string;
  assignmentId?: number;
  teamId?: number | null;
  /** Whether to allow students to view their score and feedback (default: true) */
  allowViewScore?: boolean;
  /** Whether to allow students to review their selected answers (default: false) */
  allowReview?: boolean;
  /** Callback when student clicks "Xem lại" button */
  onReviewClick?: () => void;
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  result,
  assignmentTitle,
  assignmentId,
  teamId,
  allowViewScore = true,
  allowReview = false,
  onReviewClick,
}) => {
  const router = useRouter();
  
  // Ensure props are properly set (with debug info)
  const finalAllowViewScore = allowViewScore ?? true;
  const finalAllowReview = allowReview ?? false;

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🎯 QuizResultScreen Props:', {
      allowViewScore,
      allowReview,
      finalAllowViewScore,
      finalAllowReview,
    });
  }
  
  const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  const correctQuestions = result.correctQuestions ?? (
    result.maxScore > 0 && result.totalQuestions > 0
      ? Math.round((result.score / result.maxScore) * result.totalQuestions)
      : 0
  );

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: 'Xuất sắc', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    if (pct >= 75) return { label: 'Giỏi', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    if (pct >= 60) return { label: 'Khá', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
    if (pct >= 50) return { label: 'Trung bình', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    return { label: 'Chưa đạt', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  };

  const grade = getGrade(percentage);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Top accent */}
        <div className="h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8 flex flex-col gap-6 items-center text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Đã nộp bài!</h1>
            <p className="text-slate-500 mt-1">{assignmentTitle}</p>
          </div>

          {/* Score & Feedback - Controlled by allowViewScore */}
          {finalAllowViewScore ? (
            <>
              {/* Score Card */}
              <div className={`w-full rounded-2xl border-2 px-6 py-5 ${grade.bg}`}>
                <div className={`text-5xl font-bold ${grade.color} tabular-nums`}>
                  {result.score}
                  <span className="text-2xl text-slate-400">/{result.maxScore}</span>
                </div>
                <div className={`text-sm font-semibold mt-1 ${grade.color}`}>
                  {percentage}% — {grade.label}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Chấm điểm tự động ngay sau khi nộp
                </div>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xl font-bold text-slate-800">{correctQuestions}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Số câu đúng</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xl font-bold text-slate-800">
                    {result.answeredQuestions}/{result.totalQuestions}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Đã trả lời</div>
                </div>
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div className="w-full bg-slate-50 rounded-xl p-4 text-left">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Nhận xét</p>
                  <p className="text-sm text-slate-700">{result.feedback}</p>
                </div>
              )}
            </>
          ) : (
            // Score Hidden Message
            <div className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-6 py-8 text-center">
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803c1.079-2.57 3.47-4.521 6.356-4.713a4.971 4.971 0 00-.572-1.003H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-2.05A4.993 4.993 0 0015.875 15.075z" />
              </svg>
              <div className="text-sm font-semibold text-slate-600">Điểm số đã được ẩn</div>
              <p className="text-xs text-slate-500 mt-1">Giáo viên chưa cho phép xem điểm</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            {/* Review Button - Controlled by allowReview */}
            {finalAllowReview && (
              <button
                onClick={onReviewClick}
                type="button"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-base
                  hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Xem lại bài làm
              </button>
            )}

            {/* Back Button */}
            <button
              onClick={() => {
                if (teamId && assignmentId) {
                  router.push(`/teams/${teamId}?assignmentId=${assignmentId}&type=QUIZ`);
                } else {
                  router.push('/online-quizzes');
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-base
                hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Về danh sách bài tập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultScreen;
