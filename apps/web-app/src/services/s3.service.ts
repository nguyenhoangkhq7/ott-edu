/**
 * S3 Upload Utility
 * 
 * Uses AWS S3 configuration from .env
 * For production, integrate with AWS SDK or backend upload endpoint
 */

export const uploadFileToS3 = async (file: File): Promise<string> => {
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'product-images-hau';
  const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || 'ap-southeast-1';
  const baseUrl = process.env.NEXT_PUBLIC_AWS_S3_PUBLIC_BASE_URL;

  return new Promise((resolve) => {
    // TODO: For production, implement actual S3 upload using:
    // - AWS SDK v3 (@aws-sdk/client-s3)
    // - Pre-signed URLs from backend
    // - Or multipart upload endpoint
    
    // Mock delay simulating S3 upload
    setTimeout(() => {
      const fileName = file.name;
      const timestamp = Date.now();
      const key = `assignments/${timestamp}/${fileName}`;
      
      // If baseUrl is configured, use it; otherwise construct S3 URL
      const s3Url = baseUrl 
        ? `${baseUrl}/${key}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      
      resolve(s3Url);
    }, 1000);
  });
};

/**
 * Validate file for upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size cannot exceed 50MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};
