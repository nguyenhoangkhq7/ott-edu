'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/shared/providers/AuthProvider';
import { assignmentApi, submissionApi } from '@/services/api/assignment.service';
import { AssignmentDetail, SubmissionStatus } from '@/shared/types/quiz';
import AppLoader from '@/shared/components/common/AppLoader';
import Link from 'next/link';

interface StudentAnswerDetail {
  questionId: number;
  questionContent: string;
  questionPoints: number;
  questionType: string;
  selectedOptionIds: number[];
  earnedPoints: number;
}

interface SubmissionGrade {
  id: number;
  score: number;
  feedback: string;
  gradedAt: string;
  revision: number;
}

interface SubmissionDetail {
  id: number;
  submissionId: number;
  assignmentId: number;
  accountId: number;
  status: SubmissionStatus;
  createdAt: string;
  submittedAt: string;
  isLate: boolean;
  fileUrl?: string; // for essays
  assignmentTitle: string;
  maxScore: number;
  dueDate: string;
  studentAnswers?: StudentAnswerDetail[];
  grade?: SubmissionGrade;
}

export default function ReviewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const assignmentId = Number(params.id);
  const submissionId = Number(params.submissionId);
  const teamId = searchParams.get('teamId');
  const mode = searchParams.get('mode') || 'full'; // 'full' or 'answers-only'

  const { user } = useAuth();
  const isTeacher = user?.roles?.includes('ROLE_TEACHER') ?? false;

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId || !submissionId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch assignment details and submission in parallel
        const [assignmentData, submissionData] = await Promise.all([
          assignmentApi.getDetail(assignmentId),
          isTeacher
            ? submissionApi.getSubmissionDetailForTeacher(submissionId)
            : submissionApi.getMySubmission(submissionId),
        ]);

        setAssignment(assignmentData);
        setSubmission(submissionData as SubmissionDetail);
      } catch (err: unknown) {
        console.error('Error fetching review data:', err);
        const errorDetail = err as { response?: { data?: { message?: string } } };
        setError(errorDetail.response?.data?.message || 'Không thể tải chi tiết bài làm.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, submissionId, isTeacher]);

  if (loading) {
    return <AppLoader />;
  }

  if (error || !assignment || !submission) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-slate-500 mb-6 max-w-md">{error || 'Không tìm thấy thông tin bài làm hoặc bài nộp.'}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  const isQuiz = assignment.type === 'QUIZ';
  const showScore = mode === 'full' && (submission.status === 'GRADED' || submission.status === 'SUBMITTED');

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get filename from URL
  const getFileName = (url?: string) => {
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url);
      return decoded.substring(decoded.lastIndexOf('/') + 1);
    } catch {
      return 'Tập tin bài làm';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 page-transition">
      {/* Header section with glassmorphism details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60" />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={
                teamId
                  ? `/teams/${teamId}?assignmentId=${assignmentId}&type=${isQuiz ? 'QUIZ' : 'ASSIGNMENT'}`
                  : '/assignments'
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
            >
              ← Trở về chi tiết
            </Link>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
              isQuiz ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {isQuiz ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
              submission.status === 'GRADED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : submission.status === 'SUBMITTED'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {submission.status === 'GRADED' ? 'Đã chấm' : submission.status === 'SUBMITTED' ? 'Đã nộp' : 'Nháp'}
            </span>
            {submission.isLate && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                Nộp muộn
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
            {assignment.title}
          </h1>
          <p className="text-sm text-slate-500">
            Nộp lúc: <span className="font-semibold text-slate-700">{formatDate(submission.submittedAt || submission.createdAt)}</span>
          </p>
        </div>

        {/* Score visualization box */}
        {showScore ? (
          <div className="flex items-center gap-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl p-5 md:min-w-[200px] shrink-0">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200">
              💯
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Điểm số đạt được</p>
              <p className="text-2xl font-black text-indigo-950 mt-0.5">
                {submission.grade?.score ?? 0}
                <span className="text-sm font-bold text-slate-500"> / {assignment.maxScore}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center md:min-w-[200px] shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm số</p>
            <p className="text-sm font-semibold text-slate-600 mt-1.5 italic">Được ẩn bởi giáo viên</p>
          </div>
        )}
      </div>

      {/* Grade and Feedback banner */}
      {showScore && submission.grade && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-base">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Nhận xét của giáo viên
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {submission.grade.feedback || 'Không có nhận xét nào.'}
          </div>
          <div className="text-xs text-slate-400 text-right">
            Đã chấm vào: {formatDate(submission.grade.gradedAt)}
          </div>
        </div>
      )}

      {/* Main Review Section */}
      {isQuiz ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Chi tiết các câu trả lời
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {assignment.questions?.length || 0} câu hỏi
            </span>
          </div>

          <div className="space-y-6">
            {assignment.questions?.map((question, qIdx) => {
              // Find student answer
              const studentAnswer = submission.studentAnswers?.find(
                (sa) => sa.questionId === question.id
              );
              const selectedOptionIds = studentAnswer?.selectedOptionIds || [];
              const earnedPoints = studentAnswer?.earnedPoints ?? 0;
              const isCorrect = earnedPoints > 0;
              const isAnswered = selectedOptionIds.length > 0;

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-colors"
                >
                  {/* Question Title & Points */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {question.type === 'SINGLE_CHOICE'
                            ? 'Chọn một đáp án'
                            : question.type === 'MULTI_CHOICE'
                              ? 'Chọn nhiều đáp án'
                              : 'Đúng/Sai'}
                        </span>
                        {mode === 'full' && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-base leading-relaxed">
                        {question.content}
                      </h3>
                    </div>

                    {/* Question Point display */}
                    <div className="text-right shrink-0">
                      {mode === 'full' ? (
                        <>
                          <div className={`text-xl font-extrabold ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {earnedPoints}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            trên {question.points} đ
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-extrabold text-slate-600">
                            {question.points}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            điểm
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Warning if unanswered */}
                  {!isAnswered && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-medium">
                      <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Câu hỏi này chưa được trả lời.
                    </div>
                  )}

                  {/* Options render list */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {question.options?.map((option, oIdx) => {
                      const isSelected = selectedOptionIds.includes(option.id);
                      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

                      let cardStyle = 'border border-slate-200 bg-white text-slate-700';
                      let letterStyle = 'bg-slate-100 text-slate-500';
                      let statusBadge = null;

                      if (isSelected) {
                        if (mode === 'full') {
                          if (isCorrect) {
                            cardStyle = 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium';
                            letterStyle = 'bg-emerald-600 text-white';
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 ml-auto">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Đúng
                              </span>
                            );
                          } else {
                            cardStyle = 'border-rose-300 bg-rose-50/50 text-rose-950 font-medium';
                            letterStyle = 'bg-rose-600 text-white';
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 ml-auto">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                </svg>
                                Lựa chọn của bạn
                              </span>
                            );
                          }
                        } else {
                          // answers-only
                          cardStyle = 'border-indigo-300 bg-indigo-50/60 text-indigo-950 font-medium';
                          letterStyle = 'bg-indigo-600 text-white';
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 ml-auto">
                              Lựa chọn của bạn
                            </span>
                          );
                        }
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${cardStyle}`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${letterStyle}`}>
                            {letters[oIdx]}
                          </div>
                          <span className="font-medium">{option.content}</span>
                          {statusBadge}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Essay layout view */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 11-2.828-2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Tập tin bài làm đã nộp
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đề bài & Hướng dẫn</p>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {assignment.instructions || 'Không có hướng dẫn đi kèm.'}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Bài làm của sinh viên</p>
              {submission.fileUrl ? (
                <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-base shrink-0">
                      📄
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {getFileName(submission.fileUrl)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tập tin nộp tự luận
                      </p>
                    </div>
                  </div>
                  <a
                    href={submission.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải xuống
                  </a>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                  Không tìm thấy tập tin bài nộp.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
