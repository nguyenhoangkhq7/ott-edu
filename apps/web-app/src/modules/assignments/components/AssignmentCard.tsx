'use client';

import React from 'react';
import { Assignment } from '@/shared/types/quiz';
import Link from 'next/link';

interface AssignmentCardProps {
  assignment: Assignment;
  role: 'STUDENT' | 'TEACHER';
}

export default function AssignmentCard({ assignment, role }: AssignmentCardProps) {
  const now = new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = dueDate && dueDate < now;
  const isArchived = assignment.archivedAt !== null;

  const getStatusBadge = () => {
    if (isArchived) {
      return { label: 'Đã lưu trữ', color: 'bg-slate-100 text-slate-600' };
    }
    if (isOverdue) {
      return { label: 'Quá hạn', color: 'bg-red-100 text-red-700' };
    }
    return { label: 'Đang mở', color: 'bg-green-100 text-green-700' };
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'Không có hạn';
    const date = new Date(isoDate);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = () => {
    switch (assignment.type) {
      case 'QUIZ':
        return 'Bài kiểm tra';
      case 'ESSAY':
        return 'Bài luận';
      default:
        return assignment.type || 'Bài tập';
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{assignment.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{getTypeLabel()}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Description */}
      {assignment.instructions && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {assignment.instructions}
        </p>
      )}

      {/* Meta Information */}
      <div className="flex flex-col gap-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            Hạn nộp: {formatDate(assignment.dueDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <span>Điểm tối đa: {assignment.maxScore}</span>
        </div>
      </div>

      {/* Action Button */}
      {!isArchived && !isOverdue && role === 'STUDENT' && (
        <Link
          href={`/assignments/${assignment.id}/quiz`}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Vào làm bài
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      )}

      {role === 'TEACHER' && (
        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <button className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            Chỉnh sửa
          </button>
          <button className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Xem bài nộp
          </button>
        </div>
      )}
    </div>
  );
}
