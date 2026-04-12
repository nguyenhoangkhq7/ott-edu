"use client";

import React, { useState, useEffect } from 'react';
import { teamApi, Team, TeamRequest } from '@/services/api/teamApi';

interface EditTeamDialogProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTeamDialog({
  isOpen,
  team,
  onClose,
  onSuccess,
}: EditTeamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TeamRequest>({
    name: '',
    description: '',
    joinCode: '',
    departmentId: 1,
  });

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        joinCode: team.joinCode || '',
        departmentId: team.departmentId || 1,
      });
      setError(null);
    }
  }, [team, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'departmentId') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team) return;

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Tên lớp học không được để trống');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await teamApi.update(team.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Không thể cập nhật thông tin lớp học. Vui lòng thử lại.');
      console.error('Error updating team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sửa thông tin lớp học</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên lớp học */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên lớp học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Toán Cao Cấp - Lớp B"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả chi tiết về lớp học..."
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Mã tham gia */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mã tham gia
              </label>
              <input
                type="text"
                name="joinCode"
                value={formData.joinCode}
                onChange={handleChange}
                placeholder="VD: ABC123"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Khoa */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Khoa
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="1">Khoa Công Nghệ Thông Tin</option>
                <option value="2">Khoa Kỹ Thuật</option>
                <option value="3">Khoa Kinh Tế</option>
                <option value="4">Khoa Ngoại Ngữ</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
