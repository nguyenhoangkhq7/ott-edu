package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.SubmissionStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubmissionDto {
    private Long id;
    private Long accountId;
    private LocalDateTime submittedAt;
    private SubmissionStatus status;
    private Long assignmentId;
}
