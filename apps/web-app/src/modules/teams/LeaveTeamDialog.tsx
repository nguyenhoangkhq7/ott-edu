"use client";

import React, { useState } from 'react';
import { teamApi } from '@/services/api/teamApi';

interface LeaveTeamDialogProps {
  isOpen: boolean;
  teamId: number | null;
  teamName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeaveTeamDialog({
  isOpen,
  teamId,
  teamName,
  onClose,
  onSuccess,
}: LeaveTeamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    if (!teamId) return;

    setIsLoading(true);
    setError(null);

    try {
      await teamApi.leaveTeam(teamId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể rời lớp học. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !teamId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Rời khỏi lớp học</h2>
          </div>

          <p className="text-slate-700 mb-2">
            Bạn có chắc chắn muốn rời khỏi lớp học <span className="font-semibold">&quot;{teamName}&quot;</span>?
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Bạn sẽ không thể truy cập vào tài liệu, bài đăng và cuộc trò chuyện của lớp học này nữa.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded font-medium transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleLeave}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {isLoading ? 'Đang xử lý...' : 'Rời lớp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
