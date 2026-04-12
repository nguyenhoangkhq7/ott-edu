'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AssignmentDetail, Submission } from '@/shared/types/quiz';
import { quizService } from '@/services/api/quiz.service';
import { PreQuizModal } from '@/shared/components/quiz/PreQuizModal';
import { TakeQuizEngine } from '@/modules/quiz/TakeQuizEngine';
import AppLoader from '@/shared/components/common/AppLoader';

type PageState = 'loading' | 'pre-quiz' | 'taking-quiz' | 'error';

export default function QuizPage() {
  const params = useParams();
  // Changed params.assignmentId to params.id to match the folder structure [id]
  const assignmentId = Number(params.id);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!assignmentId || isNaN(assignmentId)) {
      setErrorMsg('ID bài kiểm tra không hợp lệ.');
      setPageState('error');
      return;
    }
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      const detail = await quizService.getAssignmentDetail(assignmentId);
      setAssignment(detail);

      // Check if student already has an active submission (resume case)
      const existingSubmission = await quizService.getMySubmission(assignmentId);
      if (existingSubmission && existingSubmission.id) {
        // Resume existing submission
        setSubmission(existingSubmission);
        setPageState('taking-quiz');
      } else {
        // First time - show pre-quiz screen
        setPageState('pre-quiz');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải bài kiểm tra.');
      setPageState('error');
    }
  };

  const handleStartQuiz = async () => {
    if (!assignment) return;
    const newSubmission = await quizService.startAssignment(assignmentId);
    setSubmission(newSubmission);
    setPageState('taking-quiz');
  };

  if (pageState === 'loading') {
    return <AppLoader />;
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-slate-500 mb-6">{errorMsg}</p>
          <a
            href="/assignments"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold
              hover:bg-indigo-700 transition-colors"
          >
            ← Quay lại danh sách
          </a>
        </div>
      </div>
    );
  }

  if (pageState === 'pre-quiz' && assignment) {
    return <PreQuizModal assignment={assignment} onStart={handleStartQuiz} />;
  }

  if (pageState === 'taking-quiz' && assignment && submission) {
    return <TakeQuizEngine assignment={assignment} submission={submission} />;
  }

  return <AppLoader />;
}
