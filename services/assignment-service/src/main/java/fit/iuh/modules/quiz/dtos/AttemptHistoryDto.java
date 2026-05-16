package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.SubmissionStatus;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO representing a single attempt history record
 * 
 * Used to display:
 * - Attempt number / Date-Time
 * - Score earned / Status
 * - Feedback (if graded)
 * 
 * Returned by: GET /api/v1/submissions/attempt-history/{assignmentId}
 */
@Data
public class AttemptHistoryDto {

    private Long submissionId;

    // Attempt metadata
    private Integer attemptNumber; // 1st, 2nd, 3rd attempt
    private LocalDateTime submittedAt;

    // Score & Status
    private Double score; // null if not yet graded
    private Double maxScore;
    private SubmissionStatus status; // DRAFT, SUBMITTED, GRADED

    // Feedback from teacher (if graded)
    private String feedback;

    // Display helpers
    public String getFormattedSubmittedAt() {
        if (submittedAt == null)
            return "Draft";
        return submittedAt.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    public String getScoreDisplay() {
        if (score == null) {
            return status == SubmissionStatus.GRADED ? "0" : "-";
        }
        return String.format("%.2f", score);
    }
}
