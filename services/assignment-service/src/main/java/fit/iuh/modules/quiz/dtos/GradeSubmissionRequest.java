package fit.iuh.modules.quiz.dtos;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO for TEACHER to grade a student's submission
 * 
 * Security Note:
 * - gradedBy (teacher ID) is extracted from SecurityContext, NOT from request
 * body
 * - Can only be used by TEACHER role
 * - Score validation ensures it doesn't exceed assignment's max score
 * - Feedback is optional but encouraged
 */
@Data
public class GradeSubmissionRequest {

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score cannot be negative")
    @Max(value = 1000, message = "Score cannot exceed 1000")
    private Double score;

    @Size(max = 3000, message = "Feedback cannot exceed 3000 characters")
    private String feedback;

    // Note: gradedBy is extracted from SecurityContext (teacher's accountId)
    // Note: submissionId comes from URL path, not request body
}
