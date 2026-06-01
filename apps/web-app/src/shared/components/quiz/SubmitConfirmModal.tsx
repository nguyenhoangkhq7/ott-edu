'use client';

import React from 'react';

interface SubmitConfirmModalProps {
  totalQuestions: number;
  answeredCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  totalQuestions,
  answeredCount,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Xác nhận nộp bài?</h2>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Warning if unanswered */}
          {unansweredCount > 0 && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Cần xem xét</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Bạn còn <strong>{unansweredCount} câu chưa trả lời</strong>.
                  Nộp bài ngay sẽ ghi điểm 0 cho các câu đó.
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{answeredCount}</div>
              <div className="text-xs text-green-600 mt-0.5">Đã trả lời</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
              <div className="text-2xl font-bold text-slate-600">{unansweredCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Chưa trả lời</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed">
            Sau khi nộp, bạn sẽ không thể quay lại chỉnh sửa đáp án.
            Kết quả sẽ được chấm và hiển thị ngay lập tức.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold
                hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Tiếp tục làm
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold
                hover:bg-indigo-700 transition-colors disabled:opacity-60
                flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang nộp...
                </>
              ) : (
                'Nộp bài ngay'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
