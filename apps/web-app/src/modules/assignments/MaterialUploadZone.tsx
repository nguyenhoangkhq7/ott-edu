'use client';

import React, { useState } from 'react';
import { useFieldArray, Control, FieldErrors, useWatch } from 'react-hook-form';
import { CreateAssignmentFormData } from '@/shared/types/assignment';
import { uploadFileToS3, validateFile } from '@/services/s3.service';

interface MaterialUploadZoneProps {
  control: Control<CreateAssignmentFormData>;
  errors: FieldErrors<CreateAssignmentFormData>;
}

export default function MaterialUploadZone({
  control,
}: MaterialUploadZoneProps) {
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'materialUrls' as any,
  });

  // Watch the actual string values from form state
  const materialUrls = useWatch({
    control,
    name: 'materialUrls',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        continue;
      }

      try {
        setUploading(true);
        const s3Url = await uploadFileToS3(file);
        console.log('Uploaded S3 URL:', s3Url);
        appendMaterial(s3Url);
        setUploadError(null);
      } catch (err: unknown) {
        console.error('Upload error:', err);
        const error = err as { message?: string };
        setUploadError(error.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }

    // Reset file input
    if (e.currentTarget) {
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Tài liệu tham khảo (không bắt buộc)</h3>

      {/* Drop Zone */}
      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
        />

        <svg className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600">
          {uploading ? 'Đang tải lên...' : 'Kéo và thả tệp hoặc nhấp để chọn'}
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel, TXT, Hình ảnh (max 50MB)</p>
      </label>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {materialFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Tệp đã tải ({materialFields.length})</p>
          <div className="space-y-2">
            {materialFields.map((field, index) => {
              // Get the actual URL value from watched materialUrls array
              const materialUrl = materialUrls?.[index] || '';
              const fileName = materialUrl.split('/').pop() || 'File';

              return (
                <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <a
                      href={materialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate"
                      title={materialUrl}
                    >
                      {fileName}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
