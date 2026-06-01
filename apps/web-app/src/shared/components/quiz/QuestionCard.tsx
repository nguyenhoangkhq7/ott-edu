'use client';

import React from 'react';
import { Question, QuestionType, LocalAnswers } from '@/shared/types/quiz';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answers: LocalAnswers;
  onChange: (questionId: number, selectedOptionIds: number[]) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answers,
  onChange,
}) => {
  const selectedIds = answers[question.id] ?? [];

  const handleOptionClick = (optionId: number) => {
    if (
      question.type === QuestionType.SINGLE_CHOICE ||
      question.type === QuestionType.TRUE_FALSE
    ) {
      // Single selection
      onChange(question.id, [optionId]);
    } else {
      // Multi selection - toggle
      const isSelected = selectedIds.includes(optionId);
      const next = isSelected
        ? selectedIds.filter((id) => id !== optionId)
        : [...selectedIds, optionId];
      onChange(question.id, next);
    }
  };

  const isSelected = (optionId: number) => selectedIds.includes(optionId);

  const questionTypeLabel = {
    [QuestionType.SINGLE_CHOICE]: 'Chọn một đáp án',
    [QuestionType.MULTI_CHOICE]: 'Chọn một hoặc nhiều đáp án',
    [QuestionType.TRUE_FALSE]: 'Đúng hay Sai',
  }[question.type];

  return (
    <div className="flex flex-col gap-6">
      {/* Question header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
              Câu {questionIndex + 1} / {totalQuestions}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{question.points} điểm</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
              {questionTypeLabel}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 leading-relaxed">
            {question.content}
          </h2>
        </div>
      </div>

      {/* Answer options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          const selected = isSelected(option.id);
          const isMulti = question.type === QuestionType.MULTI_CHOICE;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left
                transition-all duration-200 cursor-pointer group
                ${selected
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                }
              `}
            >
              {/* Option indicator */}
              <div
                className={`
                  flex-shrink-0 flex items-center justify-center rounded-lg font-semibold text-sm
                  transition-all duration-200
                  ${selected
                    ? isMulti
                      ? 'w-7 h-7 bg-indigo-600 text-white'
                      : 'w-7 h-7 bg-indigo-600 text-white'
                    : 'w-7 h-7 bg-slate-100 text-slate-500 group-hover:bg-indigo-100'
                  }
                `}
              >
                {isMulti && selected ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  OPTION_LETTERS[index]
                )}
              </div>

              {/* Option text */}
              <span
                className={`flex-1 text-base transition-colors duration-200 ${
                  selected ? 'text-indigo-800 font-medium' : 'text-slate-700'
                }`}
              >
                {option.content}
              </span>

              {/* Selected radio indicator (single choice) */}
              {!isMulti && (
                <div
                  className={`
                    flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    transition-all duration-200
                    ${selected ? 'border-indigo-600' : 'border-slate-300'}
                  `}
                >
                  {selected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
