package submission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO: SubmissionRequestDTO
 * Dùng để nhận request từ client khi sinh viên nộp bài
 * 
 * Cấu trúc request:
 * - content: Nội dung bài nộp (cho ESSAY)
 * - materialIds: Danh sách ID materials/files đính kèm (từ S3)
 * - answers: Danh sách câu trả lời (cho QUIZ)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionRequestDTO {

    /**
     * Nội dung bài nộp (cho ESSAY)
     * - Có thể NULL nếu là QUIZ
     */
    private String content;

    /**
     * Danh sách ID của Materials (files) đính kèm
     * - Lấy từ S3 hoặc hệ thống lưu trữ file
     * - Có thể NULL nếu không có file đính kèm
     */
    private List<Long> materialIds;

    /**
     * Danh sách câu trả lời (cho QUIZ)
     * - Chứa questionId, selectedOptionId
     * - Có thể NULL nếu là ESSAY
     */
    private List<StudentAnswerDTO> answers;
}
