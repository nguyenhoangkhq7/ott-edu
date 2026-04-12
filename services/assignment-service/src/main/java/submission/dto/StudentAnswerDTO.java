package submission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO: StudentAnswerDTO
 * Dùng để nhận request từ client khi sinh viên trả lời câu hỏi Quiz
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswerDTO {

    /**
     * ID của câu hỏi
     */
    private Long questionId;

    /**
     * ID của option được chọn
     */
    private Long selectedOptionId;

    /**
     * Điểm kiếm được (do server tính, không nhận từ client)
     */
    private Double earnedPoints;
}
