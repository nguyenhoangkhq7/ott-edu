package create_assignment.dto;

import create_assignment.enums.AssignmentType;
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
public class AssignmentResponseDTO {

    private Long id;

    private String title;

    private String instructions;

    private Double maxScore;

    private LocalDateTime dueDate;

    private LocalDateTime createdAt;

    private AssignmentType type;

    private Long teamId;

    private List<MaterialDTO> materials;

    private List<QuestionResponseDTO> questions;

    // ---- Nested response DTOs ----

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialDTO {
        private Long id;
        private String name;
        private String url;
        private String type;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponseDTO {
        private Long id;
        private String content;
        private List<AnswerOptionResponseDTO> answerOptions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerOptionResponseDTO {
        private Long id;
        private String content;
        private Boolean isCorrect;
    }
}
