import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export class S3Service {
  private static readonly BUCKET_NAME =
    process.env.AWS_S3_BUCKET || "chat-uploads";
  private static readonly EXPIRATION = 3600; // 1 hour in seconds

  /**
   * Generate a presigned URL for uploading files to S3
   * @param fileName - Unique file name (ideally with timestamp or UUID)
   * @param fileType - MIME type of the file
   * @returns Presigned PUT URL that can be used by client
   */
  static async generatePresignedUrl(
    fileName: string,
    fileType: string,
  ): Promise<string> {
    try {
      // Validate inputs
      if (!fileName || !fileType) {
        throw new Error("fileName and fileType are required");
      }

      // Sanitize file name to prevent directory traversal
      const sanitizedFileName = this.sanitizeFileName(fileName);

      // Create folder structure: uploads/{conversationId}/{timestamp}_{fileName}
      const s3Key = `uploads/${Date.now()}_${sanitizedFileName}`;

      const putObjectCommand = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: s3Key,
        ContentType: fileType,
      });

      // Generate presigned URL
      const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, {
        expiresIn: this.EXPIRATION,
      });

      // Extract the actual file URL from presigned URL (remove query params for storage)
      const fileUrl = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

      return JSON.stringify({
        presignedUrl, // For uploading
        fileUrl, // For storing in DB
        s3Key, // For reference
        expiresIn: this.EXPIRATION,
      });
    } catch (error) {
      console.error("[S3Service] Error generating presigned URL:", error);
      throw new Error(
        `Failed to generate presigned URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Sanitize file name to remove potentially dangerous characters
   */
  private static sanitizeFileName(fileName: string): string {
    // Remove path separators and special characters
    return fileName
      .replace(/[\/\\]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 255); // Max filename length
  }

  /**
   * Generate multiple presigned URLs at once
   */
  static async generateBatchPresignedUrls(
    files: Array<{ fileName: string; fileType: string }>,
  ): Promise<Array<object>> {
    try {
      const urls = await Promise.all(
        files.map((file) =>
          this.generatePresignedUrl(file.fileName, file.fileType),
        ),
      );
      return urls.map((url) => JSON.parse(url));
    } catch (error) {
      console.error(
        "[S3Service] Error generating batch presigned URLs:",
        error,
      );
      throw error;
    }
  }
}

export default S3Service;
