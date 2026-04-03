package fit.iuh.dtos;

import fit.iuh.models.enums.AssignmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDTO {
    private Long id;
    private String title;
    private String instructions;
    private Double maxScore;
    private LocalDateTime dueDate;
    private AssignmentType type;
    private Long teamId;
    private List<QuestionDTO> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDTO {
        private Long id;
        private String content;
        private Double points;
        private String questionType;
        private List<AnswerOptionDTO> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerOptionDTO {
        private Long id;
        private String content;
        private boolean isCorrect;
        private Integer displayOrder;
    }
}
