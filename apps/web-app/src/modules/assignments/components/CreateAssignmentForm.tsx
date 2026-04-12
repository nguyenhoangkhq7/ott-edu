"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Zap, Calendar, Clock, Loader } from 'lucide-react';
import { AssignmentType } from '@/modules/assignments/types';
import { 
  createAssignment, 
  publishAssignment,
  AssignmentApiError,
  convertToISO8601
} from '@/modules/assignments/services/assignmentService';
import { useToast } from '@/shared/hooks/useToast';

interface CreateAssignmentFormProps {
  teamId?: string | number;
  teamName?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface IAssignmentFormData {
  title: string;
  description: string;
  assignmentType: AssignmentType;
  maxPoints: number;
  dueDate: string;
  dueTime: string;
  teams: (string | number)[];
}

export default function CreateAssignmentForm({
  teamId = '1',  // Default to '1' if not provided
  teamName = 'Current Team',
  onClose,
  onSuccess,
}: CreateAssignmentFormProps) {
  const router = useRouter();
  const { success, error: errorToast, loading: loadingToast, dismiss } = useToast();
  
  // Convert team slug or string to numeric ID
  // Mapping: slug → numeric ID (temporary until backend provides real IDs)
  const slugToTeamIdMap: Record<string, number> = {
    'web-programming': 1,
    'advanced-math': 2,
    'data-science': 3,
    'mobile-dev': 4,
  };
  
  // Extract numeric ID from teamId (could be slug or number)
  const getNumericTeamId = (id: string | number): number => {
    if (typeof id === 'number') return id;
    
    const numId = parseInt(id, 10);
    if (!isNaN(numId) && numId > 0) return numId;
    
    // Try slug mapping
    if (slugToTeamIdMap[id]) return slugToTeamIdMap[id];
    
    // Default to 1
    return 1;
  };
  
  const validTeamId = String(getNumericTeamId(teamId));

  const [formData, setFormData] = useState<IAssignmentFormData>({
    title: '',
    description: '',
    assignmentType: AssignmentType.ESSAY,
    maxPoints: 10,
    dueDate: '',
    dueTime: '23:59',
    teams: [validTeamId], // Initialize with validTeamId
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure default team is always selected
  React.useEffect(() => {
    console.log('📋 CreateAssignmentForm initialized - validTeamId:', validTeamId, 'formData.teams:', formData.teams);
    
    // If validTeamId is provided but not in formData.teams, add it
    if (validTeamId && !formData.teams.includes(validTeamId)) {
      console.log('⚙️  Adding default team to selection:', validTeamId);
      setFormData(prev => ({
        ...prev,
        teams: [validTeamId]
      }));
    }
  }, [validTeamId]);

  // ============ HANDLERS ============
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxPoints' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      errorToast('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    if (!formData.dueDate) {
      errorToast('Vui lòng chọn hạn nộp');
      return;
    }

    if (formData.teams.length === 0) {
      errorToast('Vui lòng chọn lớp/nhóm để giao bài tập');
      return;
    }

    // Check if QUIZ type requires questions (not yet implemented)
    if (formData.assignmentType === AssignmentType.QUIZ) {
      errorToast('Tính năng tạo bài trắc nghiệm (Quiz) đang phát triển. Vui lòng chọn loại "Tự luận" trước.');
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = loadingToast('Đang tạo bài tập...');

    try {
      // Convert datetime-local to ISO 8601
      const formattedDateTime = `${formData.dueDate}T${formData.dueTime}`;
      const dueDateIso = convertToISO8601(formattedDateTime);

      // Create assignment
      const selectedTeamId = formData.teams.length > 0 ? formData.teams[0] : validTeamId;
      const numericTeamId = Number(selectedTeamId);
      
      console.log('🔍 Debug info:', {
        'formData.teams': formData.teams,
        'validTeamId (prop)': validTeamId,
        'selectedTeamId': selectedTeamId,
        'Number(selectedTeamId)': numericTeamId,
        'isValid:': !isNaN(numericTeamId) && numericTeamId > 0,
      });

      const assignmentData = {
        title: formData.title.trim(),
        instructions: formData.description || '',
        maxScore: Number(formData.maxPoints),
        dueDate: dueDateIso,
        type: formData.assignmentType,
        teamId: numericTeamId || 1, // Fallback to 1 if NaN
        materialIds: [],
        questions: [], // TODO: Add question support later
      };

      console.log('✅ Assignment data before API call:', assignmentData);

      const assignment = await createAssignment(assignmentData);

      // Publish assignment immediately after creation
      dismiss(loadingToastId);
      const publishToastId = loadingToast('Đang giao bài tập...');

      await publishAssignment(assignment.id);

      dismiss(publishToastId);
      success('Bài tập đã được tạo và giao thành công!');

      // Callback or navigate
      if (onSuccess) {
        onSuccess();
      } else {
        onClose?.();
        // Optional: Navigate to assignments list
        router.push('/assignments');
      }
    } catch (err) {
      dismiss(loadingToastId);
      
      console.error('Lỗi tạo bài tập:', err);
      
      if (err instanceof AssignmentApiError) {
        console.error(`API Error - Code: ${err.code}, Status: ${err.statusCode}, Message: ${err.message}`);
        errorToast(`Lỗi: ${err.message}`);
      } else if (err instanceof Error) {
        console.error(`Error: ${err.message}`);
        errorToast(`Lỗi: ${err.message}`);
      } else {
        console.error('Lỗi chưa xác định:', err);
        errorToast('Không thể tạo bài tập. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      formData.title.trim() ||
      formData.description.trim() ||
      uploadedFiles.length > 0
    ) {
      if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu sẽ không được lưu.')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  const handleToggleTeam = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      teams: prev.teams.includes(id)
        ? prev.teams.filter((t) => t !== id)
        : [...prev.teams, id],
    }));
  };

  // ============ RENDER ============
  return (
    <div className="w-full h-full bg-white" style={{ willChange: 'transform' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white shadow-sm" style={{ willChange: 'transform' }}>
        <h1 className="text-2xl font-bold text-slate-900">Giao bài tập mới</h1>
        <button
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100%-80px)]">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]" style={{ willChange: 'scroll-position' }}>
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8">
            {/* ============ CỘT TRÁI (2/3) - NỘI DUNG ============ */}
            <div className="col-span-2 space-y-6">
              {/* Tiêu đề bài tập */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tiêu đề bài tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Bài kiểm tra Chương 3 - Phương trình bậc 2"
                  maxLength={100}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.title.length}/100 ký tự
                </p>
              </div>

              {/* Hướng dẫn / Mô tả */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hướng dẫn / Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập hướng dẫn chi tiết cho bài tập. Ví dụ: Làm bài kiểm tra trong vòng 45 phút, không được dùng tài liệu..."
                  maxLength={2000}
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.description.length}/2000 ký tự
                </p>
              </div>

              {/* Câu hỏi trắc nghiệm (AI Generator) - chỉ hiển thị khi type là quiz */}
              {formData.assignmentType === AssignmentType.QUIZ && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Câu hỏi Trắc nghiệm
                      </label>
                      <p className="text-xs text-slate-600">
                        Bạn có thể tạo câu hỏi thủ công hoặc dùng AI để tạo tự động.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap text-sm font-medium flex-shrink-0 ml-4"
                    >
                      <Zap className="w-4 h-4" />
                      Tạo bằng AI
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ============ CỘT PHẢI (1/3) - CẤU HÌNH ============ */}
            <div className="col-span-1 space-y-6">
              {/* Loại bài tập */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Loại bài tập <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: AssignmentType.QUIZ, label: 'Trắc nghiệm (Quiz)' },
                    { value: AssignmentType.ESSAY, label: 'Tự luận (Essay)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="assignmentType"
                        value={option.value}
                        checked={formData.assignmentType === option.value}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Thang điểm tối đa */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Thang điểm tối đa
                </label>
                <input
                  type="number"
                  name="maxPoints"
                  value={formData.maxPoints}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-2">Mặc định: 10 điểm</p>
              </div>

              {/* Hạn nộp - Ngày */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hạn nộp - Ngày
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Hạn nộp - Giờ */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hạn nộp - Giờ
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    name="dueTime"
                    value={formData.dueTime}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Giao cho lớp/nhóm */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Giao cho lớp/nhóm
                </label>
                <div className="space-y-2">
                  {/* Default team */}
                  <label className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.teams.includes(validTeamId)}
                      onChange={() => handleToggleTeam(validTeamId)}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {teamName}
                      </p>
                      <p className="text-xs text-slate-600">Lớp hiện tại</p>
                    </div>
                  </label>

                  {/* Note */}
                  <p className="text-xs text-slate-500 text-center py-2">
                    Hiện tại chỉ có thể giao cho 1 lớp/nhóm
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 px-8 py-6 border-t border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Đang xử lý...' : 'Giao bài tập'}
          </button>
        </div>
      </form>
    </div>
  );
}
