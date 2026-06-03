/**
 * S3 Upload Utility — REAL IMPLEMENTATION via Core Service
 *
 * Direct S3 upload from the browser can suffer from CORS issues.
 * Instead, we proxy uploads through the core-service's attachments upload endpoint.
 * This uploads the file to S3 server-side and returns the public S3 URL.
 */

import apiClient from '@/services/api/axios';

/**
 * Upload a file to S3 by routing it through the core-service attachments endpoint.
 * Returns the permanent file URL stored in S3.
 */
export const uploadFileToS3 = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  // POST the file to core-service. Using 'assignments' as classId maps the files nicely.
  const response = await apiClient.post<{ fileUrl: string }>(
    '/attachments/class/assignments',
    formData,
    {
      headers: {
        'Content-Type': undefined as any,
      },
    }
  );

  if (!response.data || !response.data.fileUrl) {
    throw new Error('Không nhận được đường dẫn tập tin từ máy chủ.');
  }

  return response.data.fileUrl;
};

/**
 * Validate file for upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50 MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size cannot exceed 50MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};
