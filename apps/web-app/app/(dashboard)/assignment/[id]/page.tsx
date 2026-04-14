"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader, AlertCircle, ArrowLeft, Clock, CheckCircle, XCircle, Upload, Edit2, Trash2 } from 'lucide-react';
import { getAssignmentsByTeam, AssignmentApiError, formatDateTime } from '@/modules/assignments/services/assignmentService';
import { Assignment } from '@/modules/assignments/types';

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params?.id ? Number(params.id) : null;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) {
        setError('ID bài tập không hợp lệ');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        // Tạm thời fetch tất cả assignment và tìm assignment có id phù hợp
        // Trong tương lai nên tạo endpoint riêng getAssignmentById
        const teamId = 1; // Default team
        const data = await getAssignmentsByTeam(teamId);
        const found = data?.find((a) => a.id === assignmentId);
        
        if (found) {
          setAssignment(found);
          // Mặc định chưa nộp - trong tương lai lấy từ API
          setIsSubmitted(false);
          setIsGraded(false);
        } else {
          setError('Không tìm thấy bài tập');
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        if (err instanceof AssignmentApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Không thể tải chi tiết bài tập');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  // Countdown timer effect
  useEffect(() => {
    if (!assignment) return;

    const calculateTimeRemaining = () => {
      const dueDate = new Date(assignment.dueDate).getTime();
      const now = new Date().getTime();
      const diff = dueDate - now;

      if (diff <= 0) {
        setTimeRemaining("Hết hạn");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days} ngày ${hours} giờ ${minutes} phút`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} giờ ${minutes} phút ${seconds} giây`);
      } else {
        setTimeRemaining(`${minutes} phút ${seconds} giây`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [assignment]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/assignments"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Đang tải chi tiết bài tập...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-start p-6 bg-red-50 rounded-xl border border-red-200 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Lỗi</h3>
            </div>
            <p className="text-sm text-red-800 mb-4">{error}</p>
            <Link
              href="/assignments"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Quay lại
            </Link>
          </div>
        )}

        {/* Assignment Detail */}
        {!isLoading && !error && assignment && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <div className="mb-6 pb-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-orange-600 mb-2">
                      {assignment.title}
                    </h1>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                      assignment.type === 'QUIZ'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {assignment.type === 'QUIZ' ? '📝 Trắc nghiệm' : '✍️ Tự luận'}
                  </span>
                </div>
              </div>

              {/* Status Table */}
              <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-2 gap-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Trạng thái bài nộp</span>
                    <span className={`flex items-center gap-2 font-semibold ${isSubmitted ? 'text-green-600' : 'text-red-600'}`}>
                      {isSubmitted ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Đã nộp để chấm điểm
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Chưa nộp
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Trạng thái chấm điểm</span>
                    <span className={`flex items-center gap-2 font-semibold ${isGraded ? 'text-green-600' : 'text-slate-500'}`}>
                      {isGraded ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Đã chấm điểm
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Chưa chấm điểm
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 gap-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Thời gian còn lại</span>
                    <span className="flex items-center gap-2 font-semibold text-orange-600">
                      <Clock className="w-5 h-5" />
                      {timeRemaining || "Đang tính..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Chính sửa lần cuối</span>
                    <span className="text-slate-600">
                      {lastModified ? formatDateTime(lastModified) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Điểm tối đa</p>
                <p className="text-2xl font-bold text-slate-900">{assignment.maxScore}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Hạn nộp</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDateTime(assignment.dueDate)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Lớp</p>
                <p className="text-sm font-bold text-slate-900">{assignment.teamId}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Ngày tạo</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDateTime(assignment.createdAt)}
                </p>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Nội dung bài tập</h2>
              <div className="text-slate-700 whitespace-pre-wrap">
                {assignment.instructions}
              </div>
            </div>

            {/* Submission Section */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Trạng thái bài nộp</h2>
              
              {!isSubmitted ? (
                // Not submitted - Show upload section
                <div className="space-y-6">
                  {assignment.type === 'ESSAY' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Nộp tập tin
                      </label>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                        <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <p className="text-blue-600 font-semibold mb-1">Kéo thả file tại đây hoặc nhấp để chọn</p>
                        <p className="text-sm text-blue-500">Hỗ trợ: PDF, DOCX, PPTX</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Nộp bài
                    </button>
                    <Link
                      href="/assignments"
                      className="px-6 py-3 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Quay lại
                    </Link>
                  </div>
                </div>
              ) : (
                // Submitted - Show edit/delete options
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 font-semibold">
                      ✓ Bài nộp của bạn đã được nhận vào {lastModified ? formatDateTime(lastModified) : 'lúc đó'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-3">Bài nộp gần đây</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">📄</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">submission_file.pdf</p>
                          <p className="text-xs text-slate-500">{lastModified ? formatDateTime(lastModified) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200 mt-6">
                    <button className="px-4 py-2 bg-blue-100 text-blue-600 font-medium rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm">
                      <Edit2 className="w-4 h-4" />
                      Sửa bài làm
                    </button>
                    <button className="px-4 py-2 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm">
                      <Trash2 className="w-4 h-4" />
                      Loại bỏ bài nộp
                    </button>
                    <Link
                      href="/assignments"
                      className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm ml-auto"
                    >
                      Quay lại
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
