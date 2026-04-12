"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader,
  Award,
  MessageSquare,
} from 'lucide-react';
import { getStudentResult, formatDateTime, formatDate, AssignmentApiError } from '@/modules/assignments/services/assignmentService';
import { useToast } from '@/shared/hooks/useToast';

export interface StudentGradeViewProps {
  assignmentId?: string | number;
  onBackClick?: () => void;
}

/**
 * StudentGradeView Component
 * 
 * Displays student's assignment result including:
 * - Assignment title and type
 * - Submission status
 * - Score and feedback (if graded)
 * - Submission date and grading date
 * - Incorrect answers (for QUIZ type)
 */
export default function StudentGradeView({
  assignmentId: propAssignmentId,
  onBackClick,
}: StudentGradeViewProps) {
  const params = useParams();
  const { error: errorToast, loading: loadingToast, dismiss } = useToast();

  // Get assignmentId from props or URL params
  const assignmentId = propAssignmentId || (params?.assignmentId as string);

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch student's assignment result on mount
   */
  useEffect(() => {
    const fetchResult = async () => {
      if (!assignmentId) {
        setError('Không tìm thấy ID bài tập');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getStudentResult(Number(assignmentId));
        setResult(data);
      } catch (err) {
        if (err instanceof AssignmentApiError) {
          setError(err.message);
          errorToast(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
          errorToast(err.message);
        } else {
          setError('Không thể tải kết quả bài tập');
          errorToast('Không thể tải kết quả bài tập');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [assignmentId, errorToast]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="w-full h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Không thể tải kết quả</h2>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.'}
          </p>
          <button
            onClick={onBackClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isGraded = result.submissionStatus === 'GRADED';
  const isSubmitted = result.submissionStatus === 'SUBMITTED' || isGraded;
  const isNotSubmitted = result.submissionStatus === 'NOT_SUBMITTED';

  const scorePercentage = result.maxScore ? (result.score || 0) / result.maxScore * 100 : 0;
  const scoreColor =
    scorePercentage >= 80
      ? 'text-green-600'
      : scorePercentage >= 60
        ? 'text-amber-600'
        : scorePercentage >= 40
          ? 'text-orange-600'
          : 'text-red-600';

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBackClick}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium border border-slate-200 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {result.assignmentTitle}
          </h1>
          <p className="text-slate-600">
            Loại bài: <span className="font-semibold">
              {result.assignmentType === 'QUIZ' ? 'Trắc nghiệm (Quiz)' : 'Tự luận (Essay)'}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          {isNotSubmitted && (
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900">Chưa nộp bài</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Bạn chưa nộp bài tập này. Vui lòng nộp bài tập để giáo viên chấm điểm.
                </p>
              </div>
            </div>
          )}

          {isSubmitted && !isGraded && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 flex items-start gap-4">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900">Đang chờ chấm điểm</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Bài tập của bạn đã được nộp. Giáo viên sẽ chấm bài và trả kết quả trong thời gian sớm nhất.
                </p>
                {result.submittedAt && (
                  <p className="text-xs text-blue-700 mt-2">
                    Thời gian nộp: {formatDateTime(result.submittedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {isGraded && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-900">Đã chấm điểm</h3>
                <p className="text-sm text-green-800 mt-1">
                  Giáo viên đã chấm bài tập của bạn. Xem chi tiết bên dưới.
                </p>
                {result.gradedAt && (
                  <p className="text-xs text-green-700 mt-2">
                    Thời gian chấm: {formatDateTime(result.gradedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Score Card (if graded) */}
          {isGraded && result.score !== undefined && (
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
              <div className="mb-4">
                <Award className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              </div>
              <p className="text-sm text-slate-600 mb-2">Điểm của bạn</p>
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className={`text-5xl font-bold ${scoreColor}`}>
                  {result.score}
                </span>
                <span className="text-2xl font-semibold text-slate-400">
                  /{result.maxScore || 10}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    scorePercentage >= 80
                      ? 'bg-green-500'
                      : scorePercentage >= 60
                        ? 'bg-amber-500'
                        : scorePercentage >= 40
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(scorePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {scorePercentage >= 80
                  ? '🎉 Tuyệt vời'
                  : scorePercentage >= 60
                    ? '👍 Tốt'
                    : scorePercentage >= 40
                      ? '⚠️ Cần cải thiện'
                      : '❌ Chưa đạt'}
              </p>
            </div>
          )}

          {/* Submission Content */}
          {result.submissionContent && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Nội dung bài làm
              </h3>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-96 overflow-y-auto">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {result.submissionContent}
                </p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {isGraded && result.feedback && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Nhận xét của giáo viên
              </h3>

              <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {result.feedback}
                </p>
              </div>
            </div>
          )}

          {/* Incorrect Answers (for QUIZ) */}
          {result.assignmentType === 'QUIZ' &&
            result.incorrectAnswers &&
            result.incorrectAnswers.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Câu trả lời sai
                </h3>

                <div className="space-y-4">
                  {result.incorrectAnswers.map((answer: any, index: number) => (
                    <div
                      key={index}
                      className="bg-red-50 rounded-lg p-4 border border-red-200"
                    >
                      <p className="text-sm font-semibold text-red-900 mb-3">
                        Câu {index + 1}: {answer.question}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-red-700 font-medium">Bạn trả lời:</span>
                          <p className="text-red-600 mt-1">{answer.studentAnswer}</p>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">Đáp án đúng:</span>
                          <p className="text-green-600 mt-1">{answer.correctAnswer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Info Card */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm sticky top-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Thông tin bài tập
            </h4>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-1">
                  Trạng thái
                </p>
                <div className="flex items-center gap-2">
                  {isNotSubmitted && (
                    <>
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700">
                        Chưa nộp
                      </span>
                    </>
                  )}
                  {isSubmitted && !isGraded && (
                    <>
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">
                        Chờ chấm
                      </span>
                    </>
                  )}
                  {isGraded && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Đã chấm
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Max Score */}
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-1">
                  Thang điểm
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {result.maxScore || 10} điểm
                </p>
              </div>

              {/* Submitted Date */}
              {result.submittedAt && (
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-1">
                    Nộp bài
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDateTime(result.submittedAt)}
                  </p>
                </div>
              )}

              {/* Graded Date */}
              {result.gradedAt && isGraded && (
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-1">
                    Chấm bài
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDateTime(result.gradedAt)}
                  </p>
                </div>
              )}

              {/* Assignment Type */}
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-1">
                  Loại bài
                </p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  result.assignmentType === 'QUIZ'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {result.assignmentType === 'QUIZ' ? 'Trắc nghiệm' : 'Tự luận'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
