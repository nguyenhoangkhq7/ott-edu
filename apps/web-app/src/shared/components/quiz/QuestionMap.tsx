'use client';

import React from 'react';
import { Question, LocalAnswers } from '@/shared/types/quiz';

interface QuestionMapProps {
  questions: Question[];
  currentIndex: number;
  answers: LocalAnswers;
  flaggedIds: Set<number>;
  onNavigate: (index: number) => void;
}

export const QuestionMap: React.FC<QuestionMapProps> = ({
  questions,
  currentIndex,
  answers,
  flaggedIds,
  onNavigate,
}) => {
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[Number(qId)]?.length > 0
  ).length;

  const flaggedCount = flaggedIds.size;
  const notAnsweredCount = questions.length - answeredCount;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-4">
      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-3 h-3 rounded-sm bg-indigo-600 flex-shrink-0" />
          <span>Đã trả lời ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-3 h-3 rounded-sm bg-amber-500 flex-shrink-0" />
          <span>Đã đánh dấu ({flaggedCount})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-3 h-3 rounded-sm bg-slate-200 flex-shrink-0" />
          <span>Chưa làm ({notAnsweredCount})</span>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Question Grid */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Bản đồ câu hỏi
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = (answers[q.id]?.length ?? 0) > 0;
            const isFlagged = flaggedIds.has(q.id);
            const isCurrent = idx === currentIndex;

            let cellClass =
              'w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-all duration-150 border-2 ';

            if (isCurrent) {
              cellClass += 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-110 ';
            } else if (isFlagged) {
              cellClass += 'border-amber-400 bg-amber-400 text-white ';
            } else if (isAnswered) {
              cellClass += 'border-indigo-500 bg-indigo-500 text-white ';
            } else {
              cellClass +=
                'border-slate-200 bg-slate-100 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 ';
            }

            return (
              <button
                key={q.id}
                className={cellClass}
                onClick={() => onNavigate(idx)}
                title={`Câu ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionMap;
