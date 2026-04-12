"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Loader,
} from 'lucide-react';
import { StudentSubmission, SubmissionStatus, AssignmentType } from '@/modules/assignments/types';
import { getSubmissions, gradeSubmission, AssignmentApiError, formatDateTime } from '@/modules/assignments/services/assignmentService';
import { useToast } from '@/shared/hooks/useToast';

// ============ MAIN COMPONENT ============
export interface GradingDashboardProps {
  assignmentId: string | number; // Required for API calls
  assignmentTitle?: string;
  maxPoints?: number;
  onBackClick?: () => void;
}

export default function GradingDashboard({
  assignmentId,
  assignmentTitle = 'Bài tập',
  maxPoints = 10,
  onBackClick,
}: GradingDashboardProps) {
  const { success, error: errorToast, loading: loadingToast, dismiss } = useToast();

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  // ============ EFFECTS ============
  
  /**
   * Fetch submissions when component mounts
   */
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        const data = await getSubmissions(Number(assignmentId));
        setSubmissions(Array.isArray(data) ? data : []);
        
        // Auto-select first submission
        if (data && data.length > 0) {
          handleSelectSubmission(data[0]);
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
        errorToast('Không thể tải danh sách bài nộp.');
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId, errorToast]);

  // ============ HANDLERS ============
  const handleSelectSubmission = (submission: StudentSubmission) => {
    setSelectedSubmission(submission);
    setGradeInput(submission.grade?.toString() || '');
    setFeedbackInput(submission.feedback || '');
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) {
      errorToast('Chưa chọn bài nộp');
      return;
    }

    const score = parseFloat(gradeInput);
    if (isNaN(score) || score < 0 || score > (maxPoints || 10)) {
      errorToast(`Vui lòng nhập điểm từ 0 đến ${maxPoints}`);
      return;
    }

    setIsGrading(true);
    const loadingToastId = loadingToast('Đang lưu điểm...');

    try {
      await gradeSubmission(Number(selectedSubmission.id), {
        score: Number(score), // Ensure it's a number
        feedback: feedbackInput,
      });

      // Update local state
      const updatedSubmissions = submissions.map((sub) =>
        sub.id === selectedSubmission.id
          ? { ...sub, grade: score, feedback: feedbackInput, status: 'GRADED' as SubmissionStatus }
          : sub
      );
      setSubmissions(updatedSubmissions);

      const updatedSelected = updatedSubmissions.find((s) => s.id === selectedSubmission.id);
      if (updatedSelected) {
        setSelectedSubmission(updatedSelected);
      }

      dismiss(loadingToastId);
      success(`Đã lưu điểm cho ${selectedSubmission.studentName}`);
    } catch (err) {
      dismiss(loadingToastId);
      if (err instanceof AssignmentApiError) {
        errorToast(`Lỗi: ${err.message}`);
      } else {
        errorToast('Không thể lưu điểm. Vui lòng thử lại.');
      }
    } finally {
      setIsGrading(false);
    }
  };

  // ============ UTILITY FUNCTIONS ============
  
  const getStatusBadge = (status: SubmissionStatus) => {
    if (status === 'GRADED') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-700">Đã chấm</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 rounded-full">
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-blue-700">Chờ chấm</span>
      </div>
    );
  };

  const getPDFPreviewUrl = (fileUrl: string): string => {
    return `https://docs.google.com/gview?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`;
  };

  // ============ RENDER ============
  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-6 bg-white border-b border-slate-200 shadow-sm">
        <button
          onClick={onBackClick}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Quay lại</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{assignmentTitle}</h1>
          <p className="text-sm text-slate-600 mt-1">
            Thang điểm: {maxPoints} điểm
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* ============ CỘT TRÁI: DANH SÁCH SINH VIÊN ============ */}
        <div className="w-[30%] bg-white border-r border-slate-200 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Đang tải danh sách...</p>
              </div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Chưa có bài nộp nào</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="px-4 py-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Danh sách sinh viên ({submissions.length})
                </h2>
              </div>

              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  onClick={() => handleSelectSubmission(submission)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selectedSubmission?.id === submission.id
                      ? 'bg-blue-50 border-blue-300 shadow-md'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={submission.studentAvatar || 'https://via.placeholder.com/40'}
                      alt={submission.studentName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {submission.studentName}
                      </p>
                      <p className="text-xs text-slate-600">
                        {formatDateTime(submission.submittedDate)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge + Type */}
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(submission.status)}
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        submission.assignmentType === AssignmentType.QUIZ
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {submission.assignmentType === AssignmentType.QUIZ ? 'Trắc nghiệm' : 'Tự luận'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============ CỘT PHẢI: NỘI DUNG & FORM ============ */}
        {isLoading ? (
          <div className="flex-1 bg-slate-50 flex items-center justify-center">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Đang tải...</p>
            </div>
          </div>
        ) : !selectedSubmission ? (
          <div className="flex-1 bg-slate-50 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Chọn một bài nộp để xem chi tiết</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-slate-50 overflow-y-auto p-8">
            {/* Student Info Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={selectedSubmission.studentAvatar || 'https://via.placeholder.com/64'}
                  alt={selectedSubmission.studentName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedSubmission.studentName}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Nộp bài: {formatDateTime(selectedSubmission.submittedDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz AI Suggestion (nếu là QUIZ) */}
            {selectedSubmission.assignmentType === AssignmentType.QUIZ &&
              selectedSubmission.earnedPoints !== undefined && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">
                      Điểm AI gợi ý: {selectedSubmission.earnedPoints}/{maxPoints}
                    </p>
                    <p className="text-xs text-indigo-800 mt-1">
                      Hệ thống tự động chấm dựa trên câu trả lời. Giáo viên có thể điều chỉnh
                      theo đánh giá cá nhân.
                    </p>
                  </div>
                </div>
              )}

            {/* Submission Content */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Nội dung bài làm</h3>

              {/* Text Content */}
              {selectedSubmission.content && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto border border-slate-200">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.content}
                  </p>
                </div>
              )}

              {/* File Attachment */}
              {selectedSubmission.attachmentFile && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">
                    📎 Tài liệu đính kèm
                  </h4>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedSubmission.attachmentFile.filename}
                        </p>
                        <p className="text-xs text-slate-600">
                          Loại: {selectedSubmission.attachmentFile.fileType.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PDF Preview */}
                  {selectedSubmission.attachmentFile.fileType === 'pdf' && (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <iframe
                        src={getPDFPreviewUrl(
                          selectedSubmission.attachmentFile.fileUrl
                        )}
                        title="PDF Preview"
                        className="w-full h-96 border-none"
                        style={{ minHeight: '400px' }}
                      />
                    </div>
                  )}

                  {/* Other file types fallback */}
                  {selectedSubmission.attachmentFile.fileType !== 'pdf' && (
                    <div className="bg-slate-100 rounded-lg p-8 text-center border border-slate-300">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">
                        Nhấn vào tên file để tải về
                      </p>
                      <a
                        href={selectedSubmission.attachmentFile.fileUrl}
                        download={selectedSubmission.attachmentFile.filename}
                        className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Tải xuống
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grading Form */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Chấm điểm & Nhận xét</h3>

              <div className="space-y-6">
                {/* Score Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Điểm số <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                      placeholder="0"
                      min="0"
                      max={maxPoints}
                      step="0.5"
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                    />
                    <span className="text-sm font-medium text-slate-600">/ {maxPoints}</span>
                  </div>
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nhận xét
                  </label>
                  <textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Nhập nhận xét chi tiết cho học sinh. Ví dụ: Bài làm rất tốt, nhưng cần chú ý thêm về... hoặc cần cải thiện..."
                    rows={6}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {feedbackInput.length}/1000 ký tự
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitGrade}
                  disabled={isGrading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGrading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Trả bài & Lưu điểm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
