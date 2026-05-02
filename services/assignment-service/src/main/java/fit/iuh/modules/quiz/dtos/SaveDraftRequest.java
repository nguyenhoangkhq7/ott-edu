package fit.iuh.modules.quiz.dtos;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * DTO for STUDENT to save draft answers (auto-save while doing assignment)
 * 
 * Security Note:
 * - submissionId passed as path parameter (not in request body)
 * - studentAccountId extracted from SecurityContext (NOT from request)
 * - Allows auto-saving progress without final submission
 * - Supports both quiz answers and essay text drafts
 */
@Data
public class SaveDraftRequest {

    /**
     * For QUIZ type assignments: List of question answers
     * Each answer represents a student's selection for a question
     */
    private List<SubmitAnswerDto> questionAnswers;

    /**
     * For ESSAY type assignments: Text content of the essay
     */
    @Size(max = 50000, message = "Essay content cannot exceed 50000 characters")
    private String essayContent;

    /**
     * Optional: For future use - file upload URLs
     */
    private String fileUrl;

    // Note: submissionId is passed as path parameter:
    // /submissions/{submissionId}/save-draft
    // Note: studentAccountId is extracted from SecurityContext in Controller
    // Note: status will remain DRAFT until final submission
}
