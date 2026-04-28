package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.SubmissionStatus;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for TEACHER to view a list of submissions for grading
 * 
 * Lightweight summary for submission grading list (Microservices Pattern)
 * - Returns ONLY accountId (minimal data to maintain service boundary)
 * - Frontend/BFF will aggregate with core-service for student names
 * - Indicates if already graded or pending
 * - Used in grading dashboard
 */
@Data
public class SubmissionGradingListDto {

    private Long submissionId;
    private Long studentAccountId; // Student who submitted (minimal - no personal details)
    private Long assignmentId;
    private SubmissionStatus status;
    private LocalDateTime submittedAt;
    private boolean isLate;

    // Grade status
    private boolean isGraded;
    private Double currentScore;
    private Integer gradeRevision;
}
