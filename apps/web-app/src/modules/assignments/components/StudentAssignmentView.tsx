"use client";

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  FileText,
  Download,
  Clock,
  AlertCircle,
  Upload,
  X,
  CheckCircle,
} from 'lucide-react';

// ============ TYPES ============
export type AssignmentStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';

export interface Material {
  id: string;
  name: string;
  fileType: string; // 'pdf' | 'pptx' | 'docx' etc
  fileUrl: string;
  fileSize: number; // in bytes
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  dueTime: string;
  maxScore: number;
  materials: Material[];
  status: AssignmentStatus;
  submittedDate?: string;
  submittedFile?: {
    filename: string;
    fileUrl: string;
    uploadedDate: string;
  };
  grade?: number;
  feedback?: string;
}

// ============ MOCK DATA ============
const mockAssignment: Assignment = {
  id: 'assign_001',
  title: 'Bài tập lớn môn Công nghệ mới - Thiết kế Microservices',
  instructions: `Hãy thiết kế sơ đồ triển khai (Deployment Diagram) cho hệ thống SmileEdu và viết báo cáo giải trình chi tiết.

Yêu cầu:
1. Vẽ sơ đồ triển khai cho 3 môi trường: Development, Staging, Production
2. Giải thích kiến trúc microservices:
   - API Gateway
   - Auth Service
   - Assignment Service
   - Grading Service
   - Notification Service
3. Mô tả flow của dữ liệu giữa các services
4. Đề xuất các công nghệ (Kubernetes, Docker, Message Queue, etc.)
5. Lên kế hoạch high availability và disaster recovery

File nộp bài:
- Format: PDF hoặc DOCX (tối đa 25MB)
- Kèm file sơ đồ (Lucidchart, Draw.io export hoặc visio)
- Báo cáo 5-10 trang

Hạn nộp: Trước 23:59 ngày hạn chót`,
  dueDate: '2025-12-15',
  dueTime: '23:59',
  maxScore: 10,
  materials: [
    {
      id: 'mat_001',
      name: 'Hướng dẫn thiết kế Microservices.pdf',
      fileType: 'pdf',
      fileUrl: 'https://example.com/materials/microservices-guide.pdf',
      fileSize: 5242880, // 5MB
    },
    {
      id: 'mat_002',
      name: 'SmileEdu Architecture Overview.pptx',
      fileType: 'pptx',
      fileUrl: 'https://example.com/materials/architecture-overview.pptx',
      fileSize: 8388608, // 8MB
    },
  ],
  status: 'NOT_SUBMITTED',
};

// ============ MAIN COMPONENT ============
export interface StudentAssignmentViewProps {
  assignmentId?: string;
  classId?: string;
  className?: string;
  onBackClick?: () => void;
}

export default function StudentAssignmentView({
  assignmentId = 'assign_001',
  classId = 'class_001',
  className = 'CNM - Công nghệ Mạng',
  onBackClick,
}: StudentAssignmentViewProps) {
  const [assignment, setAssignment] = useState<Assignment>(mockAssignment);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ============ COUNTDOWN TIMER ============
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const dueDateTime = new Date(`${assignment.dueDate}T${assignment.dueTime}`);
      const diff = dueDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Đã hết hạn');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);

        if (days > 0) {
          setTimeLeft(`Còn lại ${days} ngày ${hours} giờ`);
        } else if (hours > 0) {
          setTimeLeft(`Còn lại ${hours} giờ ${minutes} phút`);
        } else {
          setTimeLeft(`Còn lại ${minutes} phút`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [assignment.dueDate, assignment.dueTime]);

  // ============ HANDLERS ============
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSubmitAssignment = async () => {
    if (!uploadedFile) {
      alert('Vui lòng chọn file để nộp bài');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Submitted assignment:', {
        assignmentId: assignment.id,
        classId,
        file: uploadedFile.name,
        notes,
        submittedDate: new Date().toLocaleString('vi-VN'),
      });

      setAssignment((prev) => ({
        ...prev,
        status: 'SUBMITTED',
        submittedDate: new Date().toLocaleString('vi-VN'),
        submittedFile: {
          filename: uploadedFile.name,
          fileUrl: URL.createObjectURL(uploadedFile),
          uploadedDate: new Date().toLocaleString('vi-VN'),
        },
      }));

      setIsSubmitting(false);
      setShowSuccessMessage(true);

      setTimeout(() => setShowSuccessMessage(false), 3000);
    }, 1500);
  };

  const handleWithdrawSubmission = () => {
    if (window.confirm('Bạn có chắc muốn hủy nộp bài không? Không thể hoàn tác.')) {
      setAssignment((prev) => ({
        ...prev,
        status: 'NOT_SUBMITTED',
        submittedFile: undefined,
      }));
      setUploadedFile(null);
      setNotes('');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = () => {
    if (assignment.status === 'GRADED') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">Đã chấm: {assignment.grade}/{assignment.maxScore}</span>
        </div>
      );
    }
    if (assignment.status === 'SUBMITTED') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">Đã nộp</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
        <Clock className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">Chưa nộp</span>
      </div>
    );
  };

  // ============ RENDER ============
  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Quay lại lớp học</span>
          </button>
          <div className="h-6 w-px bg-slate-300" />
          <div>
            <p className="text-sm text-slate-600">{className}</p>
            <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mx-8 mt-4 p-4 bg-green-100 border border-green-300 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-700">
            Bài tập đã được nộp thành công! Hãy chờ giáo viên chấm điểm.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
          {/* ============ CỘT TRÁI (65%) - THÔNG TIN BÀI TẬP ============ */}
          <div className="col-span-2 space-y-6">
            {/* Instructions */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Hướng dẫn bài tập</h2>
              <div className="prose prose-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {assignment.instructions}
              </div>
            </div>

            {/* Materials */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tài liệu học tập</h3>
              <div className="space-y-3">
                {assignment.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {material.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatFileSize(material.fileSize)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={material.fileUrl}
                      download={material.name}
                      className="ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                      title="Tải về"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadline Info */}
            <div
              className={`rounded-xl p-6 border ${
                assignment.status === 'GRADED'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {assignment.status === 'GRADED' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    {assignment.status === 'GRADED' ? 'Bài tập đã được chấm' : 'Hạn nộp bài'}
                  </h4>
                  <p className={`text-sm ${assignment.status === 'GRADED' ? 'text-green-700' : 'text-blue-700'}`}>
                    {assignment.status === 'GRADED'
                      ? `Điểm: ${assignment.grade}/${assignment.maxScore}\n${assignment.feedback}`
                      : `📅 ${assignment.dueDate} lúc ${assignment.dueTime}\n⏱️ ${timeLeft}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============ CỘT PHẢI (35%) - KHU VỰC NỘP BÀI ============ */}
          <div className="col-span-1">
            {assignment.status === 'GRADED' ? (
              // Graded Status
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm sticky top-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Bài tập đã được chấm</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Bài tập đã được chấm điểm, không thể thay đổi. Vui lòng liên hệ giáo viên nếu có thắc mắc.
                  </p>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{assignment.grade}/{assignment.maxScore}</p>
                    <p className="text-xs text-slate-600 mt-1">Điểm cuối cùng</p>
                  </div>
                  {assignment.feedback && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-left">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Nhận xét từ giáo viên:</p>
                      <p className="text-sm text-slate-600">{assignment.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Submission Area
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm sticky top-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Bài làm của bạn</h3>

                {/* Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all mb-4 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 mx-auto mb-2 ${
                      dragActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <p className="text-sm font-medium text-slate-600">Kéo file vào hoặc</p>
                  <label className="inline-block mt-1">
                    <span className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-700">
                      chọn từ máy tính
                    </span>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.docx,.doc,.zip"
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">
                    Tối đa 25MB (PDF, DOCX, ZIP)
                  </p>
                </div>

                {/* File Preview */}
                {uploadedFile && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Already Submitted File */}
                {assignment.status === 'SUBMITTED' && assignment.submittedFile && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-1">✓ Bài đã nộp:</p>
                    <p className="text-sm font-medium text-slate-900">{assignment.submittedFile.filename}</p>
                    <p className="text-xs text-slate-600">
                      Nộp lúc: {assignment.submittedFile.uploadedDate}
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ghi chú thêm (Tùy chọn)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú hoặc câu trả lời ngắn..."
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {notes.length}/500 ký tự
                  </p>
                </div>

                {/* Submit / Withdraw Buttons */}
                <div className="space-y-2">
                  {assignment.status === 'SUBMITTED' ? (
                    <>
                      <button
                        onClick={handleWithdrawSubmission}
                        className="w-full px-4 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
                      >
                        Hủy nộp
                      </button>
                      <p className="text-xs text-slate-600 text-center">
                        Bài tập đã nộp. Bạn có thể hủy nộp bài trước khi giáo viên chấm.
                      </p>
                    </>
                  ) : (
                    <button
                      onClick={handleSubmitAssignment}
                      disabled={isSubmitting || !uploadedFile}
                      className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
