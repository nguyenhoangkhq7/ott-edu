package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * DTO for creating/updating quiz questions
 * Used when creating QUIZ assignments with questions
 */
@Data
public class QuestionRequest {

    @NotBlank(message = "Question content cannot be blank")
    @Size(min = 3, max = 1000, message = "Question must be between 3 and 1000 characters")
    private String content;

    @NotNull(message = "Question type is required")
    private QuestionType type; // SINGLE_CHOICE, MULTI_CHOICE, TRUE_FALSE

    @NotNull(message = "Points is required")
    @Min(value = 1, message = "Points must be at least 1")
    @Max(value = 100, message = "Points cannot exceed 100")
    private Double points;

    @Min(value = 0, message = "Display order must be non-negative")
    private Integer displayOrder;

    @NotEmpty(message = "Question must have at least one option")
    @Valid
    private List<OptionRequest> options;
}
