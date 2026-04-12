package assign_homework.enums;

/**
 * Trạng thái Submission (bài nộp)
 */
public enum SubmissionStatus {
    /**
     * Sinh viên chưa nộp bài
     */
    NOT_SUBMITTED,

    /**
     * Sinh viên đã nộp bài
     */
    SUBMITTED,

    /**
     * Giáo viên đã chấm điểm
     */
    GRADED,

    /**
     * Bị từ chối (cần nộp lại)
     */
    REJECTED,

    /**
     * Bài học đã kết thúc (hết hạn)
     */
    DEADLINE_PASSED
}
