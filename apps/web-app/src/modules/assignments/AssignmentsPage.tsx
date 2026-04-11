"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllAssignments, AssignmentApiError, formatDateTime } from '@/modules/assignments/services/assignmentService';
import { Assignment } from '@/modules/assignments/types';
import { Loader, AlertCircle } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Dùng getAllAssignments() để lấy toàn bộ
        const data = await getAllAssignments();
        setAssignments(data || []);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        if (err instanceof AssignmentApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Không thể tải danh sách bài tập');
        }
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bài Tập</h1>
          <p className="text-slate-600">Quản lý và theo dõi bài tập của lớp học</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Đang tải danh sách bài tập...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-start p-6 bg-red-50 rounded-xl border border-red-200 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Lỗi khi tải dữ liệu</h3>
            </div>
            <p className="text-sm text-red-800 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Assignments List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Danh sách bài tập ({assignments.length})
            </h2>

            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 4h10v16H7z" />
                  </svg>
                </div>
                <p className="text-slate-600">Chưa có bài tập nào</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{assignment.instructions}</p>
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

                  {/* Info Grid */}
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">Điểm tối đa</p>
                      <p className="text-sm font-bold text-slate-900">{assignment.maxScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">Hạn nộp</p>
                      <p className="text-sm font-bold text-slate-900">
                        {formatDateTime(assignment.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">Lớp</p>
                      <p className="text-sm font-bold text-slate-900">{assignment.teamId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">Ngày tạo</p>
                      <p className="text-sm font-bold text-slate-900">{formatDateTime(assignment.createdAt)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href="/grading"
                      className="px-4 py-2 bg-blue-100 text-blue-600 font-medium rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      Chấm điểm
                    </Link>
                    <Link
                      href={`/assignment/${assignment.id}`}
                      className="px-4 py-2 bg-purple-100 text-purple-600 font-medium rounded-lg hover:bg-purple-200 transition-colors text-sm"
                    >
                      Xem chi tiết (SV)
                    </Link>
                    <Link
                      href="/grade"
                      className="px-4 py-2 bg-green-100 text-green-600 font-medium rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      Xem kết quả
                    </Link>
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm">
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}