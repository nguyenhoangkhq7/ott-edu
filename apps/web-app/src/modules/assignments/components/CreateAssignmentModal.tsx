'use client';

import React, { useState } from 'react';
import axiosClient from '@/services/api/axiosClient';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: number;
}

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
}: CreateAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    instructions: '',
    maxScore: 10,
    dueDate: '',
    type: 'QUIZ' as 'QUIZ' | 'ESSAY',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Hạn nộp là bắt buộc';
    } else {
      const selectedDate = new Date(formData.dueDate);
      if (selectedDate <= new Date()) {
        newErrors.dueDate = 'Hạn nộp phải là trong tương lai';
      }
    }

    if (formData.maxScore <= 0) {
      newErrors.maxScore = 'Điểm tối đa phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Convert datetime-local string to ISO format for backend
      const dueDateISO = formData.dueDate ? new Date(formData.dueDate).toISOString() : null;
      
      await axiosClient.post('/api/v1/assignments/create', {
        title: formData.title,
        instructions: formData.instructions || undefined,
        maxScore: formData.maxScore,
        dueDate: dueDateISO,
        type: formData.type,
        teamIds: [teamId],
      });

      setSuccessMessage('Bài tập đã được tạo thành công!');
      setTimeout(() => {
        resetForm();
        onClose();
        onSuccess();
        setSuccessMessage('');
      }, 1000);
    } catch (error: unknown) {
      let message = 'Có lỗi khi tạo bài tập';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        const response = axiosError.response?.data;
        if (typeof response === 'string') {
          message = response;
        } else if (typeof response === 'object' && response !== null && 'message' in response) {
          message = (response as Record<string, unknown>).message as string;
        }
      }
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      instructions: '',
      maxScore: 10,
      dueDate: '',
      type: 'QUIZ',
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Tạo bài tập mới</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề bài tập"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-900 placeholder-slate-400 transition-colors ${
                  errors.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Hướng dẫn (không bắt buộc)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Nhập hướng dẫn cho bài tập..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Row: Type and Max Score */}
            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Loại bài tập <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'QUIZ' | 'ESSAY' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="QUIZ">Bài kiểm tra trắc nghiệm</option>
                  <option value="ESSAY">Bài luận</option>
                </select>
              </div>

              {/* Max Score */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Điểm tối đa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-900 transition-colors ${
                    errors.maxScore
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.maxScore && <p className="text-sm text-red-600 mt-1">{errors.maxScore}</p>}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Hạn nộp <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-900 transition-colors ${
                  errors.dueDate
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {errors.dueDate && <p className="text-sm text-red-600 mt-1">{errors.dueDate}</p>}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-900 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  'Tạo bài tập'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
