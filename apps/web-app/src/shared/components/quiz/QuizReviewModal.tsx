'use client';

import React, { useState } from 'react';
import { Question, LocalAnswers } from '@/shared/types/quiz';

interface QuizReviewModalProps {
  questions: Question[];
  studentAnswers: LocalAnswers;
  assignmentTitle: string;
  allowViewScore?: boolean; // Whether to show correct answers and points
  onClose?: () => void;
}

/**
 * Quiz Review Modal
 * Displays student's submitted answers in read-only mode.
 * 
 * CRITICAL LOGIC:
 * - If allowViewScore is FALSE: Only show student's selected answers, hide correct/incorrect indicators and points
 * - If allowViewScore is TRUE: Show correct/incorrect indicators and point values
 */
export const QuizReviewModal: React.FC<QuizReviewModalProps> = ({
  questions,
  studentAnswers,
  assignmentTitle,
  allowViewScore = true,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const studentSelectedIds = studentAnswers[currentQuestion.id] || [];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const isAnswered = studentSelectedIds.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">Xem lại bài làm</h2>
            <p className="text-indigo-100 text-sm mt-1">{assignmentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-100 h-1">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                  {currentIndex + 1}
                </span>
                <span className="text-sm text-slate-600">
                  Câu {currentIndex + 1}/{questions.length}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {currentQuestion.content}
              </h3>
            </div>
            {/* Points - Only show if allowViewScore */}
            {allowViewScore && (
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentQuestion.points}
                </div>
                <div className="text-xs text-slate-500">điểm</div>
              </div>
            )}
          </div>

          {/* Answer Status Badge */}
          {!isAnswered && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-amber-800 font-medium">Câu này chưa được trả lời</span>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isStudentSelected = studentSelectedIds.includes(option.id);
              const isCorrect = option.isCorrect;

              // Determine styling based on allowViewScore and correctness
              let containerClass = 'border-2 rounded-lg p-4 cursor-default transition-colors';
              let labelClass = 'text-sm font-medium';
              let indicatorIcon = null;

              if (allowViewScore) {
                // Show correct/incorrect indicators
                if (isStudentSelected) {
                  if (isCorrect) {
                    containerClass += ' border-green-300 bg-green-50';
                    labelClass += ' text-green-900';
                    indicatorIcon = (
                      <div className="inline-flex items-center gap-1.5 ml-auto text-green-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold">Đúng</span>
                      </div>
                    );
                  } else {
                    containerClass += ' border-red-300 bg-red-50';
                    labelClass += ' text-red-900';
                    indicatorIcon = (
                      <div className="inline-flex items-center gap-1.5 ml-auto text-red-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold">Sai</span>
                      </div>
                    );
                  }
                } else {
                  // Not selected by student
                  if (isCorrect) {
                    // Show correct answer even if not selected (for learning)
                    containerClass += ' border-green-300 bg-green-50';
                    labelClass += ' text-green-900';
                    indicatorIcon = (
                      <div className="inline-flex items-center gap-1.5 ml-auto text-green-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <span className="text-xs font-semibold">Đáp án</span>
                      </div>
                    );
                  } else {
                    containerClass += ' border-slate-300 bg-slate-50';
                    labelClass += ' text-slate-700';
                  }
                }
              } else {
                // allowViewScore is FALSE: Only show student's selection
                if (isStudentSelected) {
                  containerClass += ' border-indigo-300 bg-indigo-50';
                  labelClass += ' text-indigo-900';
                  indicatorIcon = (
                    <div className="inline-flex items-center gap-1.5 ml-auto text-indigo-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 100 6 3 3 0 000-6zM7 10a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold">Lựa chọn của bạn</span>
                    </div>
                  );
                } else {
                  containerClass += ' border-slate-300 bg-slate-50';
                  labelClass += ' text-slate-700';
                }
              }

              return (
                <div key={option.id} className={containerClass}>
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-3 flex-1 cursor-default">
                      <input
                        type="checkbox"
                        checked={isStudentSelected}
                        disabled
                        className="mt-0.5 w-5 h-5 rounded"
                      />
                      <span className={labelClass}>
                        {option.content}
                      </span>
                    </label>
                    {indicatorIcon}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm
                hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Câu trước
            </button>

            <span className="text-sm text-slate-600 font-medium">
              {currentIndex + 1} / {questions.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm
                hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Câu sau
              <svg className="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-slate-100 text-slate-900 font-medium text-sm
              hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizReviewModal;
