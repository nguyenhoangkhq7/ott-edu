package view_results.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * DTO chứa thông tin câu hỏi mà sinh viên làm sai (cho Quiz)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IncorrectAnswerDTO {

    /**
     * ID của câu hỏi
     */
    private Long questionId;

    /**
     * Nội dung câu hỏi
     */
    private String questionContent;

    /**
     * Đáp án mà sinh viên đã chọn
     */
    private String selectedAnswer;

    /**
     * Đáp án đúng
     */
    private String correctAnswer;

    /**
     * Giải thích (nếu có)
     */
    private String explanation;
}
