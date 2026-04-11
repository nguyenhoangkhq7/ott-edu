package view_results.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO chứa thông tin lịch sử nộp bài (cho các bài tập cho phép revision)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionHistoryDTO {

    /**
     * ID của submission
     */
    private Long submissionId;

    /**
     * Lần nộp thứ N
     */
    private Integer revisionNumber;

    /**
     * Trạng thái bài nộp
     */
    private String status;

    /**
     * Thời gian nộp bài
     */
    private LocalDateTime submittedAt;

    /**
     * Điểm số (nếu đã chấm)
     */
    private Double score;

    /**
     * Nhận xét của giảng viên (nếu có)
     */
    private String feedback;

    /**
     * Thời gian chấm điểm
     */
    private LocalDateTime gradedAt;

    /**
     * Nội dung bài nộp
     */
    private String content;
}
