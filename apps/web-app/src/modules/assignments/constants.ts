/**
 * Assignment Module Constants & Utilities
 */

// ============ API CONFIGURATION ============

export const ASSIGNMENT_API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ENDPOINTS: {
    ASSIGNMENTS: "/api/assignments",
    TEAMS: "/teams",
    SUBMISSIONS: "/submissions",
    MATERIALS: "/materials",
    UPLOAD: "/upload",
    GRADE: "/grade",
  },
  TIMEOUT: 30000,
};

// ============ CONSTRAINTS ============

export const ASSIGNMENT_CONSTRAINTS = {
  MAX_SCORE: 1000,
  MIN_SCORE: 0,
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_FEEDBACK_LENGTH: 2000,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FILE_TYPES: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif", "zip"],
};

// ============ DISPLAY FORMATS ============

/**
 * Format ISO 8601 date to Vietnamese display format
 * Input: "2025-12-15T23:59:00" or "2025-12-15T23:59"
 * Output: "15/12/2025 23:59"
 */
export function formatDateDisplay(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return isoDate;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

/**
 * Format file size in bytes to human-readable format
 * Input: 1024000
 * Output: "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

/**
 * Check if file is supported for upload
 */
export function isSupportedFileType(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? ASSIGNMENT_CONSTRAINTS.SUPPORTED_FILE_TYPES.includes(extension) : false;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "Không có file" };
  }

  if (!isSupportedFileType(file.name)) {
    return { valid: false, error: `Loại file không hỗ trợ: ${file.name}` };
  }

  if (file.size > ASSIGNMENT_CONSTRAINTS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File quá lớn: ${formatFileSize(file.size)} (tối đa ${formatFileSize(ASSIGNMENT_CONSTRAINTS.MAX_FILE_SIZE)})`,
    };
  }

  return { valid: true };
}

// ============ ERROR MESSAGES ============

export const ERROR_MESSAGES = {
  TITLE_REQUIRED: "Tiêu đề bài tập là bắt buộc",
  TITLE_TOO_LONG: `Tiêu đề không được vượt quá ${ASSIGNMENT_CONSTRAINTS.MAX_TITLE_LENGTH} ký tự`,
  DESCRIPTION_TOO_LONG: `Mô tả không được vượt quá ${ASSIGNMENT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} ký tự`,
  DUE_DATE_REQUIRED: "Hạn nộp là bắt buộc",
  DUE_DATE_PAST: "Hạn nộp phải là ngày trong tương lai",
  MAX_SCORE_REQUIRED: "Thang điểm tối đa là bắt buộc",
  MAX_SCORE_INVALID: `Thang điểm phải từ ${ASSIGNMENT_CONSTRAINTS.MIN_SCORE} đến ${ASSIGNMENT_CONSTRAINTS.MAX_SCORE}`,
  GRADE_INVALID: "Điểm số không hợp lệ",
  FILE_UPLOAD_FAILED: "Tải file thất bại",
  ASSIGNMENT_CREATE_FAILED: "Tạo bài tập thất bại",
  ASSIGNMENT_UPDATE_FAILED: "Cập nhật bài tập thất bại",
  SUBMISSION_LOADING_FAILED: "Tải danh sách bài nộp thất bại",
  GRADE_SAVE_FAILED: "Lưu điểm thất bại",
  NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra đường truyền mạng.",
  UNAUTHORIZED: "Bạn không có quyền thực hiện hành động này",
  NOT_FOUND: "Không tìm thấy tài nguyên được yêu cầu",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
};

// ============ SUCCESS MESSAGES ============

export const SUCCESS_MESSAGES = {
  ASSIGNMENT_CREATED: "Bài tập đã được tạo thành công!",
  ASSIGNMENT_UPDATED: "Bài tập đã được cập nhật thành công!",
  ASSIGNMENT_DELETED: "Bài tập đã được xóa thành công!",
  GRADE_SAVED: "Điểm đã được lưu thành công!",
  FILE_UPLOADED: "File đã được tải lên thành công!",
};
