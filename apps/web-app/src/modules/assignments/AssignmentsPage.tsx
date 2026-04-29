'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Assignment, AssignmentType } from '@/shared/types/quiz';
import { quizService } from '@/services/api/quiz.service';
import { useAppContext } from '@/shared/providers/AppContext';
import { useAuth } from '@/shared/providers/AuthProvider';
import Link from 'next/link';

function getStatusBadge(assignment: Assignment) {
  const now = new Date();
  const due = assignment.dueDate ? new Date(assignment.dueDate) : null;

  if (assignment.archived) {
    return { label: 'Đã lưu trữ', color: 'bg-slate-100 text-slate-500' };
  }
  if (due && due < now) {
    return { label: 'Quá hạn', color: 'bg-red-100 text-red-600' };
  }
  return { label: 'Đang mở', color: 'bg-green-100 text-green-700' };
}

function formatDate(isoDate?: string) {
  if (!isoDate) return 'Không có hạn';
  return new Date(isoDate).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const AssignmentIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export default function AssignmentsPage({ teamId: routeTeamId }: { teamId?: number }) {
  const { classId: contextClassId, isLoaded } = useAppContext();
  const { isInitializing: isAuthInitializing, isAuthenticated } = useAuth();
  const teamId = routeTeamId ?? (contextClassId ? Number(contextClassId) : null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (teamId == null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getAssignments(teamId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!isLoaded || isAuthInitializing || !isAuthenticated || teamId == null) return;
    fetchAssignments();
  }, [fetchAssignments, isAuthInitializing, isAuthenticated, isLoaded, teamId]);

  if (!isLoaded || isAuthInitializing) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-500 text-sm">Đang xác thực và xác định lớp học...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
          <AssignmentIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Cần đăng nhập</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Vui lòng đăng nhập để xem các bài kiểm tra của lớp học.
          </p>
        </div>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
          <AssignmentIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Chưa chọn lớp học</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Vui lòng chọn lớp học trước khi xem bài kiểm tra.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-500 text-sm">Đang tải bài kiểm tra...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Không thể tải dữ liệu</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={fetchAssignments}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
          <AssignmentIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Chưa có bài kiểm tra</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Hiện chưa có bài kiểm tra nào được giao cho lớp của bạn.
          </p>
        </div>
      </div>
    );
  }

  const quizAssignments = assignments.filter((a) => a.type === AssignmentType.QUIZ);
  const otherAssignments = assignments.filter((a) => a.type !== AssignmentType.QUIZ);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Online Quizzes</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Xem và tham gia các bài kiểm tra của lớp học.
        </p>
      </div>

      {/* Quiz section */}
      {quizAssignments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Bài kiểm tra trắc nghiệm
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizAssignments.map((assignment) => {
              const badge = getStatusBadge(assignment);
              const isOverdue = badge.label === 'Quá hạn';
              const isArchived = assignment.archived;

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4
                    hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                      </svg>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Title and description */}
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-snug">{assignment.title}</h3>
                    {assignment.instructions && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {assignment.instructions}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        {isOverdue ? 'Hạn: ' : 'Hạn nộp: '}
                        {formatDate(assignment.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span>Tổng điểm: {assignment.maxScore}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  {isArchived || isOverdue ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed"
                    >
                      {isOverdue ? 'Đã hết hạn' : 'Đã lưu trữ'}
                    </button>
                  ) : (
                    <Link
                      href={`/online-quizzes/${assignment.id}/quiz`}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold
                        hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Vào làm bài
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Other assignments section */}
      {otherAssignments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Bài tập khác
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherAssignments.map((assignment) => {
              const badge = getStatusBadge(assignment);
              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3
                    hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(assignment.dueDate)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}