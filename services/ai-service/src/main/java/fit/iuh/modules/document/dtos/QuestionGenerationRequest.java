package fit.iuh.modules.document.dtos;

import fit.iuh.modules.document.entities.QuestionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionGenerationRequest {

    @NotNull(message = "Document ID is required")
    private UUID documentId;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Minimum 1 question")
    @Max(value = 100, message = "Maximum 100 questions")
    private Integer questionCount;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;
}
