package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.SubmissionStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for STUDENT to view their own submission
 * 
 * Security Note:
 * - Students can ONLY view their own submission (accountId must match
 * SecurityContext)
 * - Includes student's answers and earned points
 * - Does NOT expose teacher's feedback until graded
 */
@Data
public class ViewSubmissionDto {

    private Long id;
    private Long submissionId;
    private Long assignmentId;
    private Long accountId; // Own account ID only
    private SubmissionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime submittedAt;
    private boolean isLate;

    // Assignment context
    private String assignmentTitle;
    private Double maxScore;
    private LocalDateTime dueDate;

    // Student's answers with earned points
    private List<StudentAnswerWithPointsDto> studentAnswers;

    // Grade information (if graded)
    private GradeDetailsDto grade;
}
