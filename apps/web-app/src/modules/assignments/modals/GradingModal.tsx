'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { submissionApi } from '@/services/api/assignment.service';

interface GradingModalProps {
  isOpen: boolean;
  assignmentId: number;
  maxScore: number;
  onClose: () => void;
  onGradeSuccess: () => void;
}

interface Submission {
  id: number;
  studentName: string;
  studentId: number;
  submittedAt: string;
  fileUrl: string;
  status: string;
}

export default function GradingModal({
  isOpen,
  assignmentId,
  maxScore,
  onClose,
  onGradeSuccess,
}: GradingModalProps) {
  const [pending, setPending] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<number | ''>('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  const fetchPendingSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await submissionApi.getPendingSubmissions(assignmentId) as Submission[];
      setPending(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Lỗi tải danh sách chấm');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (isOpen) {
      void fetchPendingSubmissions();
    }
  }, [isOpen, fetchPendingSubmissions]);


  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore('');
    setFeedback('');
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;
    if (score === '' || score < 0 || score > maxScore) {
      setError(`Điểm phải nằm trong khoảng 0 - ${maxScore}`);
      return;
    }

    try {
      setError(null);
      setGrading(true);

      await submissionApi.gradeSubmission(selectedSubmission.id, {
        score: Number(score),
        feedback: feedback.trim(),
      });

      // Refresh pending list
      fetchPendingSubmissions();
      setSelectedSubmission(null);
      setScore('');
      setFeedback('');

      onGradeSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Chấm bài thất bại');
    } finally {
      setGrading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Chấm bài</h3>
          <button
            onClick={onClose}
            disabled={grading}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Pending List */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto bg-slate-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Đang tải...</p>
                </div>
              </div>
            ) : pending.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-slate-600">Không có bài cần chấm</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {pending.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => handleSelectSubmission(submission)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedSubmission?.id === submission.id
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : 'bg-white border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-medium text-slate-900 truncate">{submission.studentName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grading Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedSubmission ? (
              <div className="space-y-6">
                {/* Submission Info */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Thông tin nộp bài</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sinh viên:</span>
                      <span className="font-medium text-slate-900">{selectedSubmission.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ngày nộp:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div>
                      <a
                        href={selectedSubmission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tài liệu nộp
                      </a>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Score Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Điểm (0 - {maxScore})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={maxScore}
                    step="0.5"
                    value={score}
                    onChange={(e) => {
                      const value = e.target.value;
                      setScore(value === '' ? '' : Number(value));
                      setError(null);
                    }}
                    placeholder="Nhập điểm"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Nhận xét (không bắt buộc)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét cho sinh viên..."
                    rows={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    disabled={grading}
                    className="flex-1 px-4 py-2 text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmitGrade}
                    disabled={grading || score === ''}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {grading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Lưu điểm
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-600">Chọn bài để chấm</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
