'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/shared/providers/AuthProvider';
import { assignmentApi } from '@/services/api/assignment.service';
import { Assignment, AssignmentType } from '@/shared/types/quiz';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentDetail from './AssignmentDetail';

type Tab = 'upcoming' | 'pastdue';

export default function AssignmentsTab({
  teamId,
  filterType,
  initialAssignmentId
}: {
  teamId?: number;
  filterType?: 'ESSAY' | 'QUIZ';
  initialAssignmentId?: number;
}) {
  const params = useParams();
  const { user } = useAuth();

  // Resolve teamId from props or URL params
  const resolvedTeamId = teamId || Number(params.id);

  // Check if user is a teacher
  const isTeacher = user?.roles?.includes('ROLE_TEACHER') ?? false;

  // State Management
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(initialAssignmentId || null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync initialAssignmentId prop when changed
  useEffect(() => {
    if (initialAssignmentId) {
      setSelectedAssignmentId(initialAssignmentId);
    }
  }, [initialAssignmentId]);

  // Data fetching state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await assignmentApi.getByTeam(resolvedTeamId) as { content?: Assignment[] } | Assignment[];
      setAssignments(Array.isArray(response) ? response : (response.content || []));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [resolvedTeamId]);

  // Fetch assignments when component mounts or refreshTrigger changes
  useEffect(() => {
    queueMicrotask(() => {
      void loadAssignments();
    });
  }, [loadAssignments, refreshTrigger]);

  // Filter assignments by tab and type
  const getFilteredAssignments = () => {
    const now = new Date();

    let filtered = assignments;

    // Filter by type if specified
    if (filterType) {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    // Filter by due date
    if (activeTab === 'upcoming') {
      return filtered.filter((a) => new Date(a.dueDate) > now);
    } else {
      return filtered.filter((a) => new Date(a.dueDate) <= now);
    }
  };

  const filteredAssignments = getFilteredAssignments();

  const tabCount = {
    upcoming: assignments
      .filter((a) => !filterType || a.type === filterType)
      .filter((a) => new Date(a.dueDate) > new Date()).length,
    pastdue: assignments
      .filter((a) => !filterType || a.type === filterType)
      .filter((a) => new Date(a.dueDate) <= new Date()).length,
  };

  return (
    <>
      {/* Main View */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Bài tập</h1>
          {isTeacher && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo bài tập
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-lg">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-4 font-medium transition-colors relative ${activeTab === 'upcoming'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Sắp đến hạn
            <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {tabCount.upcoming}
            </span>
            {activeTab === 'upcoming' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pastdue')}
            className={`px-6 py-4 font-medium transition-colors relative ${activeTab === 'pastdue'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Đã qua hạn / Đã hoàn thành
            <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {tabCount.pastdue}
            </span>
            {activeTab === 'pastdue' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-lg border-x border-b border-slate-200 min-h-[400px]">
          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            // Loading State: Skeleton Cards
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <AssignmentSkeleton key={i} />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            // Empty State
            <EmptyState activeTab={activeTab} />
          ) : (
            // Assignment Cards List
            <div className="space-y-3 p-6">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        teamId={resolvedTeamId}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
          setIsCreateModalOpen(false);
        }}
      />

      {selectedAssignmentId && (
        <AssignmentDetailModal
          assignmentId={selectedAssignmentId}
          onClose={() => setSelectedAssignmentId(null)}
          onSuccess={() => {
            setRefreshTrigger((prev) => prev + 1);
            setSelectedAssignmentId(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Assignment Card Component
 */
interface AssignmentCardProps {
  assignment: Assignment;
  onClick: () => void;
}

function AssignmentCard({ assignment, onClick }: AssignmentCardProps) {
  const isDueDate = new Date(assignment.dueDate) <= new Date();
  const daysUntilDue = Math.ceil(
    (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {assignment.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {assignment.maxScore} điểm
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${assignment.type === AssignmentType.QUIZ
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
              }`}
          >
            {assignment.type === AssignmentType.QUIZ ? 'Trắc nghiệm' : 'Luận'}
          </span>

          {isDueDate && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 whitespace-nowrap">
              Quá hạn
            </span>
          )}

          {!isDueDate && daysUntilDue <= 3 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 whitespace-nowrap">
              {daysUntilDue} ngày
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Empty State Component
 */
interface EmptyStateProps {
  activeTab: Tab;
}

function EmptyState({ activeTab }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <svg className="w-24 h-24 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {activeTab === 'upcoming' ? 'Không có bài tập sắp đến hạn' : 'Không có bài tập đã qua hạn'}
      </h3>
      <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
        {activeTab === 'upcoming'
          ? 'Hiện tại bạn không có bài tập nào sắp đến hạn. Quay lại sau để xem các bài tập mới.'
          : 'Không có bài tập nào đã qua hạn hoặc đã hoàn thành.'}
      </p>
      {/* {isTeacher && (
        <button
          onClick={onCreateClick}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo bài tập đầu tiên
        </button>
      )} */}
    </div>
  );
}

/**
 * Assignment Skeleton Loading Component
 */
function AssignmentSkeleton() {
  return (
    <div className="p-4 border border-slate-200 rounded-lg animate-pulse bg-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-300 rounded w-3/4" />
          <div className="flex gap-3">
            <div className="h-4 bg-slate-300 rounded w-24" />
            <div className="h-4 bg-slate-300 rounded w-24" />
          </div>
        </div>
        <div className="space-y-2 flex-shrink-0">
          <div className="h-6 bg-slate-300 rounded w-20" />
          <div className="h-6 bg-slate-300 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Assignment Detail Modal Wrapper
 * Renders AssignmentDetail in a slide-over overlay
 */
interface AssignmentDetailModalProps {
  assignmentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignmentDetailModal({
  assignmentId,
  onClose,
  onSuccess,
}: AssignmentDetailModalProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-4xl overflow-y-auto bg-white shadow-2xl">
        {/* Close Button */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <AssignmentDetail
            assignmentId={assignmentId}
            onClose={onClose}
            onRefresh={onSuccess}
          />
        </div>
      </div>
    </>
  );
}
