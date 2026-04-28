package fit.iuh.modules.quiz.dtos;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

/**
 * DTO for STUDENT to submit assignment (final submission)
 * 
 * Security Note:
 * - assignmentId passed as path parameter (not in request body)
 * - studentAccountId extracted from SecurityContext (NOT from request)
 * - Validates assignment deadline before allowing submission
 * - Supports both quiz answers and essay submissions
 */
@Data
public class SubmitAssignmentRequest {

    /**
     * For QUIZ type assignments: Final list of question answers
     * All questions should be answered (validation can be added per business rules)
     */
    private List<SubmitAnswerDto> questionAnswers;

    /**
     * For ESSAY type assignments: Final essay content
     */
    @Size(max = 50000, message = "Essay content cannot exceed 50000 characters")
    private String essayContent;

    /**
     * Optional: For file submissions (essays with attachments)
     */
    private String fileUrl;

    /**
     * Optional: Confirmation flag for explicit submission intent
     * Client should set this to true when user clicks "Submit" button
     */
    @NotNull(message = "Confirmation is required for submission")
    private Boolean confirm = false;

    // Note: assignmentId is passed as path parameter: /submissions/assignment/{assignmentId}/submit
    // Note: studentAccountId is extracted from SecurityContext in Controller
    // Note: Deadline validation happens in Service layer
}
