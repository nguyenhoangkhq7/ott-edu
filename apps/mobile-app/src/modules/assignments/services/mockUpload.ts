/**
 * mockUploadService — Simulates an S3 file upload for ESSAY submissions.
 *
 * TODO: Replace with real AWS pre-signed URL upload logic when S3 is configured.
 *       Flow will be:
 *         1. Call backend to get a pre-signed PUT URL
 *         2. PUT the file bytes directly to S3
 *         3. Return the public S3 object URL
 */

export type PickedFile = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
};

export type UploadResult = {
  fileUrl: string;
  fileName: string;
};

/**
 * Simulates a 1.5-second upload delay and returns a dummy S3 URL.
 * The returned URL is passed as `fileUrl` in the submit payload.
 */
export async function uploadFileMock(file: PickedFile): Promise<UploadResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 1500));

  const safeFileName = file.name.replace(/\s+/g, "_");
  const timestamp = Date.now();
  const fileUrl = `https://s3.amazonaws.com/mock-ott-edu-bucket/${timestamp}_${safeFileName}`;

  return { fileUrl, fileName: file.name };
}
