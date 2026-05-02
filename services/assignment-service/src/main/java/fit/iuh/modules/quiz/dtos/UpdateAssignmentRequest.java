package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.AssignmentType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for TEACHER to update an existing assignment
 * 
 * Security Note:
 * - Only the assignment creator can update their assignment
 * - creatorId cannot be changed
 * - accountId extraction from SecurityContext in Controller
 */
@Data
public class UpdateAssignmentRequest {

    @NotBlank(message = "Assignment title cannot be blank")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Size(max = 2000, message = "Instructions cannot exceed 2000 characters")
    private String instructions;

    @NotNull(message = "Assignment type (QUIZ/ESSAY) is required")
    private AssignmentType type;

    @NotNull(message = "Due date is required")
    @FutureOrPresent(message = "Due date must be in the present or future")
    private LocalDateTime dueDate;

    @NotNull(message = "Max score is required")
    @Min(value = 1, message = "Max score must be at least 1")
    @Max(value = 1000, message = "Max score cannot exceed 1000")
    private Double maxScore;

    @NotEmpty(message = "At least one team ID is required")
    @Size(min = 1, message = "At least one team must be assigned")
    private List<Long> teamIds;
}
