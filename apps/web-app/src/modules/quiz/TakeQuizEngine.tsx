'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssignmentDetail, LocalAnswers, Submission, SubmissionResult } from '@/shared/types/quiz';
import { quizService } from '@/services/api/quiz.service';
import { QuestionCard } from '@/shared/components/quiz/QuestionCard';
import { QuizTimer } from '@/shared/components/quiz/QuizTimer';
import { QuestionMap } from '@/shared/components/quiz/QuestionMap';
import { SubmitConfirmModal } from '@/shared/components/quiz/SubmitConfirmModal';
import { QuizResultScreen } from '@/shared/components/quiz/QuizResultScreen';
import Link from 'next/link';

interface TakeQuizEngineProps {
  assignment: AssignmentDetail;
  submission: Submission;
}

const DEFAULT_DURATION_SECONDS = 30 * 60; // 30 minutes fallback

export const TakeQuizEngine: React.FC<TakeQuizEngineProps> = ({
  assignment,
  submission,
}) => {
  const questions = assignment.questions ?? [];
  const totalSeconds = DEFAULT_DURATION_SECONDS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<LocalAnswers>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleAnswerChange = useCallback(
    (questionId: number, selectedOptionIds: number[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: selectedOptionIds }));

      // Debounced auto-save
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(async () => {
        setAutoSaving(true);
        try {
          await quizService.saveAnswer(submission.id, questionId, selectedOptionIds);
        } catch {
          // Auto-save silently fails (not critical - we have local state)
        } finally {
          setAutoSaving(false);
        }
      }, 800);
    },
    [submission.id]
  );

  const handleFlagToggle = () => {
    const qId = questions[currentIndex]?.id;
    if (!qId) return;
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await quizService.submitAssignment(submission.id);
      // Build answeredQuestions count from local state
      const answeredCount = Object.values(answers).filter((ids) => ids.length > 0).length;
      setResult({ ...res, answeredQuestions: answeredCount });
      setShowSubmitModal(false);
    } catch (err) {
      alert('Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceSubmit = async () => {
    try {
      const res = await quizService.submitAssignment(submission.id);
      const answeredCount = Object.values(answers).filter((ids) => ids.length > 0).length;
      setResult({ ...res, answeredQuestions: answeredCount });
    } catch {
      // Silent
    }
  };

  const answeredCount = Object.values(answers).filter((ids) => ids.length > 0).length;
  const currentQuestion = questions[currentIndex];

  // Show result screen if submitted
  if (result) {
    return <QuizResultScreen result={result} assignmentTitle={assignment.title} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Submit modal overlay */}
      {showSubmitModal && (
        <SubmitConfirmModal
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Main layout: 3 columns */}
      <div className="flex min-h-screen">
        {/* ====== Left Sidebar ====== */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col py-6 px-4 gap-4">
          <Link
            href="/assignments"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về danh sách
          </Link>

          <nav className="flex flex-col gap-1">
            {[
              { label: 'Bài kiểm tra', active: true, icon: '📋' },
              { label: 'Đã hoàn thành', active: false, icon: '✅' },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                  item.active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          {/* Auto-save indicator */}
          <div className="mt-auto">
            <div className={`flex items-center gap-2 text-xs transition-opacity ${autoSaving ? 'opacity-100' : 'opacity-0'}`}>
              <svg className="animate-spin w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-slate-500">Đang lưu...</span>
            </div>
          </div>
        </aside>

        {/* ====== Center: Question Area ====== */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{assignment.title}</span>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold
                hover:bg-red-600 transition-colors"
            >
              Nộp bài
            </button>
          </div>

          {/* Question content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-2xl mx-auto">
              {currentQuestion ? (
                <QuestionCard
                  question={currentQuestion}
                  questionIndex={currentIndex}
                  totalQuestions={questions.length}
                  answers={answers}
                  onChange={handleAnswerChange}
                />
              ) : (
                <p className="text-slate-500">Không có câu hỏi nào.</p>
              )}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200
                text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Câu trước
            </button>

            <span className="text-sm text-slate-500">
              {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600
                  text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Câu tiếp
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500
                  text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                Nộp bài
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </main>

        {/* ====== Right Sidebar: Timer + Question Map ====== */}
        <aside className="w-64 flex-shrink-0 bg-slate-50 border-l border-slate-200 flex flex-col p-4 gap-4">
          {/* Timer */}
          <QuizTimer timeRemainingSeconds={timeRemaining} />

          {/* Question Map */}
          <QuestionMap
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            flaggedIds={flaggedIds}
            onNavigate={setCurrentIndex}
          />

          {/* Flag & Note buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleFlagToggle}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                currentQuestion && flaggedIds.has(currentQuestion.id)
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              {currentQuestion && flaggedIds.has(currentQuestion.id)
                ? 'Bỏ đánh dấu'
                : 'Đánh dấu câu này'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TakeQuizEngine;
