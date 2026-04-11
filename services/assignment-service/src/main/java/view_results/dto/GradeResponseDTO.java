package view_results.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO chứa thông tin kết quả chấm điểm của sinh viên
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GradeResponseDTO {

    /**
     * ID của bài tập
     */
    private Long assignmentId;

    /**
     * Tiêu đề bài tập
     */
    private String assignmentTitle;

    /**
     * Loại bài tập (QUIZ, ASSIGNMENT, PROJECT, v.v.)
     */
    private String assignmentType;

    /**
     * Trạng thái bài nộp (NOT_SUBMITTED, SUBMITTED, GRADED, REJECTED,
     * DEADLINE_PASSED)
     */
    private String submissionStatus;

    /**
     * Điểm số (nếu đã chấm)
     */
    private Double score;

    /**
     * Điểm tối đa của bài tập
     */
    private Double maxScore;

    /**
     * Nhận xét của giảng viên (nếu có)
     */
    private String feedback;

    /**
     * Thời gian chấm điểm
     */
    private LocalDateTime gradedAt;

    /**
     * Thời gian nộp bài
     */
    private LocalDateTime submittedAt;

    /**
     * Nội dung bài nộp cũ của sinh viên (để đối chiếu)
     */
    private String submissionContent;

    /**
     * Danh sách các câu hỏi mà sinh viên làm sai (chỉ dành cho QUIZ)
     */
    private List<IncorrectAnswerDTO> incorrectAnswers;

    /**
     * Message thông báo (cho các trường hợp đặc biệt)
     */
    private String message;
}
