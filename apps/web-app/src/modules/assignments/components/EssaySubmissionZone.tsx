'use client';

import React, { useState, useRef } from 'react';
import { submissionApi } from '@/services/api/assignment.service';
import { uploadFileToS3, validateFile } from '@/services/s3.service';

interface EssaySubmissionZoneProps {
  assignmentId: number;
  isDueDate: boolean;
  onSubmitSuccess: () => void;
}

export default function EssaySubmissionZone({
  assignmentId,
  isDueDate,
  onSubmitSuccess,
}: EssaySubmissionZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setError(null);
      setSuccess(null);

      // Validate file
      validateFile(selectedFile);
      setFile(selectedFile);
    } catch (err: any) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Vui lòng chọn tập tin để nộp');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setUploading(true);

      // Upload file to S3
      const fileUrl = await uploadFileToS3(file);

      setUploading(false);
      setSubmitting(true);

      // Submit assignment
      await submissionApi.submit(assignmentId, {
        fileUrl,
        confirm: true,
      });

      setSuccess('Nộp bài thành công!');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh after 1.5 seconds
      setTimeout(() => {
        onSubmitSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-slate-900 font-medium">Kéo thả tập tin hoặc</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          chọn từ máy tính
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png,.gif"
        />
        <p className="text-xs text-slate-500 mt-4">
          PDF, Word, Excel, TXT, hình ảnh (tối đa 50MB)
        </p>
      </div>

      {/* Selected File Display */}
      {file && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-600">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            disabled={uploading || submitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!file || uploading || submitting || isDueDate}
        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
          isDueDate
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : !file || uploading || submitting
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {uploading || submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {uploading ? 'Đang tải lên...' : 'Đang nộp...'}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isDueDate ? 'Quá hạn nộp' : 'Nộp bài'}
          </>
        )}
      </button>
    </div>
  );
}
