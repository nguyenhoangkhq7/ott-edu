package fit.iuh.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitQuizRequest {
    private Long assignmentId;
    private Long accountId;
    private Long teamMemberId;
    private List<StudentAnswerDTO> answers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentAnswerDTO {
        private Long questionId;
        private List<Long> selectedOptionIds; // Multiple choices
        private String content; // For essay or short answer
    }
}
