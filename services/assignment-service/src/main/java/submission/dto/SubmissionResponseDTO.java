package submission.dto;

import assign_homework.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO: SubmissionResponseDTO
 * Dùng để trả response cho client khi sinh viên nộp bài thành công
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResponseDTO {

    /**
     * ID của Submission
     */
    private Long id;

    /**
     * ID của Assignment
     */
    private Long assignmentId;

    /**
     * ID của sinh viên (StudentId/AccountID)
     */
    private Long studentId;

    /**
     * Nội dung bài nộp
     */
    private String content;

    /**
     * Điểm số (tính tự động cho Quiz, hoặc do giáo viên chấm cho Essay)
     */
    private Double score;

    /**
     * Nhận xét từ giáo viên (nếu có)
     */
    private String feedback;

    /**
     * Trạng thái bài nộp: NOT_SUBMITTED, SUBMITTED, GRADED, REJECTED,
     * DEADLINE_PASSED
     */
    private SubmissionStatus status;

    /**
     * Có quá hạn nộp hay không
     */
    private Boolean isLate;

    /**
     * Thời gian sinh viên nộp bài
     */
    private LocalDateTime submittedAt;

    /**
     * Thời gian giáo viên chấm điểm
     */
    private LocalDateTime gradedAt;

    /**
     * Danh sách câu trả lời (cho Quiz)
     */
    private List<StudentAnswerDTO> studentAnswers;

    /**
     * Thời gian tạo
     */
    private LocalDateTime createdAt;

    /**
     * Thời gian cập nhật cuối cùng
     */
    private LocalDateTime updatedAt;
}
