"use client";

import React, { useState } from 'react';

interface DeleteMemberDialogProps {
  isOpen: boolean;
  memberId: number | null;
  memberName: string;
  teamId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteMemberDialog({
  isOpen,
  memberId,
  memberName,
  teamId,
  onClose,
  onSuccess,
}: DeleteMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!memberId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Assuming we have a deleteMember method in teamApi
      // For now, we'll make the API call manually
      const response = await fetch(`http://localhost:8080/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Không thể xóa thành viên. Vui lòng thử lại.');
      console.error('Error deleting member:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !memberId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Xóa thành viên</h2>
          </div>

          <p className="text-slate-700 mb-2">
            Bạn có chắc chắn muốn xóa <span className="font-semibold">&quot;{memberName}&quot;</span> khỏi lớp học này?
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Thành viên sẽ không còn truy cập được lớp học này. Hành động này không thể hoàn tác.
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
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {isLoading ? 'Đang xóa...' : 'Xóa thành viên'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
