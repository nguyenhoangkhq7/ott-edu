'use client';

import React, { useState } from 'react';
import { AssignmentDetail } from '@/shared/types/quiz';

interface PreQuizModalProps {
  assignment: AssignmentDetail;
  onStart: () => Promise<void>;
}

export const PreQuizModal: React.FC<PreQuizModalProps> = ({ assignment, onStart }) => {
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStart();
    } finally {
      setIsStarting(false);
    }
  };

  const totalPoints = assignment.questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
  const estimatedMinutes = Math.max(15, assignment.questions.length * 3);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8 flex flex-col gap-6">
          {/* Header */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-indigo-600 uppercase mb-2">
              Assessment Portal
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {assignment.title}
            </h1>
            {assignment.instructions && (
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {assignment.instructions}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Thời gian</div>
                <div className="text-base font-bold text-slate-800">{estimatedMinutes} phút</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Số câu</div>
                <div className="text-base font-bold text-slate-800">
                  {assignment.questions.length} câu hỏi
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Tổng điểm</div>
                <div className="text-base font-bold text-slate-800">{totalPoints} điểm</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Hạn nộp</div>
                <div className="text-sm font-bold text-slate-800">
                  {assignment.dueDate ? formatDate(assignment.dueDate) : 'Không có hạn'}
                </div>
              </div>
            </div>
          </div>

          {/* Exam Protocol */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">
              Lưu ý khi làm bài
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: '☁️', label: 'Tự động lưu' },
                { icon: '✅', label: 'Tự chấm điểm' },
                { icon: '⚡', label: 'Nộp tức thì' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning note */}
          <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 leading-relaxed">
              Sau khi bấm <strong>Bắt đầu</strong>, bài thi sẽ được lưu tự động.
              Bạn có thể nộp bài bất kỳ lúc nào hoặc hệ thống sẽ tự nộp khi hết giờ.
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-lg font-bold
              hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-3"
          >
            {isStarting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang bắt đầu...
              </>
            ) : (
              <>
                Bắt đầu làm bài
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreQuizModal;
