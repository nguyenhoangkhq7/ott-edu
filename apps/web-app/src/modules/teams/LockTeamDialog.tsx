"use client";

import React, { useState } from 'react';
import { teamApi } from '@/services/api/teamApi';

interface LockTeamDialogProps {
  isOpen: boolean;
  teamId: number;
  teamName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LockTeamDialog({
  isOpen,
  teamId,
  teamName,
  onClose,
  onSuccess,
}: LockTeamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLock = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await teamApi.updateStatus(teamId, false);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Không thể khóa lớp học. Vui lòng thử lại.');
      console.error('Error locking team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Khóa lớp học</h2>
          </div>

          <p className="text-slate-700 mb-2">
            Bạn có chắc chắn muốn khóa lớp học <span className="font-semibold">&quot;{teamName}&quot;</span>?
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Các thành viên sẽ không thể truy cập lớp học này. Bạn có thể mở khóa bất kỳ lúc nào.
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
              onClick={handleLock}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {isLoading ? 'Đang khóa...' : 'Khóa lớp học'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
