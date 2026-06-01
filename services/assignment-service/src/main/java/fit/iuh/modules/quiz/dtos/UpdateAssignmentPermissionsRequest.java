package fit.iuh.modules.quiz.dtos;

import lombok.Data;

/**
 * DTO for TEACHER to patch only the review/scoring permission flags of a QUIZ assignment.
 * Used by PATCH /api/v1/assignments/{assignmentId}/permissions
 */
@Data
public class UpdateAssignmentPermissionsRequest {

    /** Whether students can see their total score after submitting. Null = no change. */
    private Boolean showScoreAfterSubmit;

    /** Whether students can review their selected answers after submitting. Null = no change. */
    private Boolean showAnswersAfterSubmit;
}
