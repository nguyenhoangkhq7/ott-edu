package fit.iuh.modules.quiz.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for creating/updating quiz question options
 * Used within QuestionRequest
 */
@Data
public class OptionRequest {

    @NotBlank(message = "Option content cannot be blank")
    @Size(min = 1, max = 500, message = "Option must be between 1 and 500 characters")
    private String content;

    private Boolean isCorrect;

    private Integer displayOrder;
}
