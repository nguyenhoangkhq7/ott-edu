'use client';

import React, { useState } from 'react';
import AssignmentCard from './AssignmentCard';
import CreateAssignmentModal from './CreateAssignmentModal';
import { AssignmentSkeletonList } from './AssignmentSkeleton';
import { useAssignments } from '../hooks/useAssignments';

interface AssignmentsTabProps {
  teamId: number;
  role: 'STUDENT' | 'TEACHER';
}

export default function AssignmentsTab({ teamId, role }: AssignmentsTabProps) {
  const { assignments, loading, error, refetch } = useAssignments(teamId, role);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Separate assignments into upcoming and completed/overdue
  const now = new Date();
  const upcomingAssignments = assignments.filter((a) => {
    const dueDate = a.dueDate ? new Date(a.dueDate) : null;
    return !a.archivedAt && dueDate && dueDate >= now;
  });

  const completedAssignments = assignments.filter((a) => {
    const dueDate = a.dueDate ? new Date(a.dueDate) : null;
    return a.archivedAt || (dueDate && dueDate < now);
  });

  const handleCreateSuccess = () => {
    setToast({ message: 'Bài tập đã được tạo thành công!', type: 'success' });
    refetch();
    setTimeout(() => setToast(null), 3000);
  };

  const currentAssignments = activeTab === 'upcoming' ? upcomingAssignments : completedAssignments;
  const hasAssignments = assignments.length > 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bài tập</h1>
          <p className="text-slate-500 text-sm mt-1">
            Xem và quản lý các bài tập cho lớp
          </p>
        </div>
        {role === 'TEACHER' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài tập
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <p className="font-semibold mb-2">Không thể tải dữ liệu</p>
          <p>{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium text-sm transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !hasAssignments && (
        <div className="space-y-4">
          <AssignmentSkeletonList count={3} />
        </div>
      )}

      {/* Empty State */}
      {!loading && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có bài tập nào</h3>
          <p className="text-slate-500 text-sm">
            {role === 'TEACHER'
              ? 'Hãy tạo bài tập đầu tiên để bắt đầu'
              : 'Giáo viên chưa giao bài tập cho lớp này'}
          </p>
          {role === 'TEACHER' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Tạo bài tập
            </button>
          )}
        </div>
      )}

      {/* Tabs and Content */}
      {!loading && assignments.length > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 px-1 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'upcoming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Sắp đến hạn
              {upcomingAssignments.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  {upcomingAssignments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 px-1 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã hoàn thành / Quá hạn
              {completedAssignments.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {completedAssignments.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {currentAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">
                {activeTab === 'upcoming' ? 'Không có bài tập sắp đến hạn' : 'Không có bài tập đã hoàn thành'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} role={role} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        teamId={teamId}
      />
    </div>
  );
}
