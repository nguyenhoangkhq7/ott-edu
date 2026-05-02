package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.AssignmentType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for TEACHER to view their own assignments with metadata
 * 
 * Includes:
 * - Assignment details
 * - Creator information
 * - Team assignments
 * - Submission count (for dashboard summary)
 * - Graded count (progress indicator)
 */
@Data
public class AssignmentTeacherViewDto {

    private Long id;
    private String title;
    private String instructions;
    private Double maxScore;
    private LocalDateTime dueDate;
    private AssignmentType type;
    private List<Long> teamIds;
    private Long creatorId;
    private LocalDateTime createdAt;
    private LocalDateTime archivedAt;
    private boolean isArchived; // For dashboard filtering
    private Long departmentId; // For department-level filtering

    // Metadata for teacher dashboard
    private Integer totalSubmissions; // Total submissions received
    private Integer gradedSubmissions; // Submissions already graded
    private Integer pendingSubmissions; // Submissions pending grading
    private Integer totalStudentsInTeams; // Expected student count from teams
}
