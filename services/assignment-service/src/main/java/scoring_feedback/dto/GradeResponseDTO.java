package scoring_feedback.dto;

import assign_homework.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO Response chứa thông tin submission + grade sau khi chấm xong
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeResponseDTO {

    private Long submissionId;

    private Long assignmentId;

    private Long studentId;

    private Long teamId;

    private SubmissionStatus status;

    // ---- Grade Info ----

    private Long gradeId;

    private Double score;

    private String feedback;

    private LocalDateTime gradedAt;

    private Long gradedByTeacherId;

    // ---- Messages ----

    private String message;
}
