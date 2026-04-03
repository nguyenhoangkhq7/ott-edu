package fit.iuh.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitQuizRequest {
    private Long assignmentId;
    private Long accountId;
    private Long teamMemberId;
    private List<StudentAnswerDTO> answers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAnswerDTO {
        private Long questionId;
        private List<Long> selectedOptionIds; // For multiple choice
        private String content; // For essay
    }
}
