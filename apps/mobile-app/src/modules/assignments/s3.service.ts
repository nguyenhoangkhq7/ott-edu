import axios from "axios";
import { API_URL } from "../api/api";
import { getAccessToken } from "../api/token-store";

/**
 * Real S3 Upload Service for Mobile
 *
 * Approach: Multipart POST to backend AttachmentController.
 * The backend handles the actual S3 interaction using AWS SDK.
 */

export type UploadProgressCallback = (progress: number) => void;

export const uploadFileToS3 = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  teamId: number,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const token = await getAccessToken();
  
  // Prepare Multipart Data
  const formData = new FormData();
  // @ts-ignore: React Native FormData expects an object for file
  formData.append("file", {
    uri: fileUri,
    name: fileName,
    type: fileType,
  });

  // Backend endpoint: /api/core/attachments/class/{classId}
  // Base API_URL usually points to the gateway.
  // We need to use the /api/core/ prefix defined in nginx.conf
  const uploadUrl = `${API_URL}/api/core/attachments/class/${teamId}`;

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    // Backend returns Attachment object: { id, fileName, fileUrl, ... }
    // We return the realUrl which is the direct S3 public link
    if (response.data && response.data.fileUrl) {
      return response.data.fileUrl;
    }

    throw new Error("Phản hồi từ server không chứa URL tệp.");
  } catch (error: any) {
    console.error("S3 Upload Error:", error);
    const message = error.response?.data?.message || error.message || "Lỗi upload file";
    throw new Error(message);
  }
};
