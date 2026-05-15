'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateAssignmentFormData } from '@/shared/types/assignment';
import { AssignmentType } from '@/shared/types/quiz';
import { assignmentApi } from '@/services/api/assignment.service';
import RichTextEditorWrapper from '@/shared/components/editors/RichTextEditorWrapper';
import QuizQuestionBuilder from '@/shared/components/forms/QuizQuestionBuilder';
import MaterialUploadZone from './MaterialUploadZone';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  teamId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAssignmentModal({
  isOpen,
  teamId,
  onClose,
  onSuccess,
}: CreateAssignmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateAssignmentFormData>({
    defaultValues: {
      title: '',
      instructions: '',
      type: AssignmentType.ESSAY,
      dueDate: '',
      maxScore: 100,
      teamIds: [teamId],
      maxAttempts: 1,
      questions: [],
      materialUrls: [],
    },
  });

  const assignmentType = watch('type');

  const onSubmit = async (data: CreateAssignmentFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate due date
      const dueDate = new Date(data.dueDate);
      if (dueDate <= new Date()) {
        setError('Due date must be in the future');
        return;
      }

      // Validate quiz has questions
      if (data.type === AssignmentType.QUIZ && (!data.questions || data.questions.length === 0)) {
        setError('Quiz must have at least one question');
        return;
      }

      // Prepare request payload - properly format all fields
      const requestPayload = {
        title: data.title.trim(),
        instructions: data.instructions ? data.instructions.trim() : '',
        type: data.type,
        dueDate: dueDate.toISOString(), // ✅ Convert datetime-local to ISO string
        maxScore: Number(data.maxScore), // ✅ Ensure it's a number
        teamIds: data.teamIds && data.teamIds.length > 0 ? data.teamIds : [parseInt(String(teamId), 10)],
        maxAttempts: data.type === AssignmentType.QUIZ && data.maxAttempts ? Number(data.maxAttempts) : undefined,
        materialUrls: data.type === AssignmentType.ESSAY && data.materialUrls && data.materialUrls.length > 0
          ? data.materialUrls.filter(url => url && url.trim().length > 0)
          : undefined,
        questions: data.type === AssignmentType.QUIZ && data.questions && data.questions.length > 0
          ? data.questions
          : undefined,
      };

      // Remove undefined fields to avoid backend issues
      Object.keys(requestPayload).forEach(key =>
        requestPayload[key as keyof typeof requestPayload] === undefined &&
        delete requestPayload[key as keyof typeof requestPayload]
      );

      console.log('Creating assignment with payload:', JSON.stringify(requestPayload, null, 2));

      const response = await assignmentApi.create(requestPayload as unknown as CreateAssignmentFormData);
      console.log('Assignment created successfully:', response);

      // Success
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Create assignment error:', err);
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create assignment';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-2xl shadow-xl bg-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Tạo bài tập mới</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tiêu đề bài tập
            </label>
            <input
              type="text"
              {...register('title', { required: 'Nhập tiêu đề' })}
              placeholder="Nhập tiêu đề bài tập..."
              className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${errors.title
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:outline-none'
                  : 'border-slate-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          {/* Instructions (Rich Text) */}
          <RichTextEditorWrapper
            label="Hướng dẫn / Mô tả"
            placeholder="Nhập hướng dẫn cho học viên..."
            register={register('instructions')}
            error={errors.instructions?.message}
            rows={5}
          />

          {/* Assignment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Loại bài tập
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={AssignmentType.ESSAY}>Bài luận (Essay)</option>
                <option value={AssignmentType.QUIZ}>Bài kiểm tra trắc nghiệm (Quiz)</option>
              </select>
            </div>

            {/* Max Score */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Tổng điểm
              </label>
              <input
                type="number"
                {...register('maxScore', { required: 'Nhập tổng điểm', min: { value: 1, message: 'Phải >= 1' } })}
                min={1}
                max={1000}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${errors.maxScore
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:outline-none'
                    : 'border-slate-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  }`}
              />
              {errors.maxScore && <p className="mt-1 text-xs text-red-600">{errors.maxScore.message}</p>}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Hạn nộp
            </label>
            <input
              type="datetime-local"
              {...register('dueDate', { required: 'Chọn hạn nộp' })}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${errors.dueDate
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:outline-none'
                  : 'border-slate-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                }`}
            />
            {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}
          </div>

          {/* QUIZ-Specific: Max Attempts */}
          {assignmentType === AssignmentType.QUIZ && (
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Số lần làm bài tối đa
              </label>
              <input
                type="number"
                {...register('maxAttempts')}
                min={1}
                max={100}
                placeholder="Để trống = không giới hạn"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">Để trống để cho phép số lần làm không giới hạn</p>
            </div>
          )}

          {/* ESSAY-Specific: Material Upload */}
          {assignmentType === AssignmentType.ESSAY && (
            <MaterialUploadZone
              control={control}
              errors={errors}
            />
          )}

          {/* QUIZ-Specific: Question Builder */}
          {assignmentType === AssignmentType.QUIZ && (
            <QuizQuestionBuilder
              control={control}
              register={register}
              errors={errors}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isLoading ? 'Đang tạo...' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
