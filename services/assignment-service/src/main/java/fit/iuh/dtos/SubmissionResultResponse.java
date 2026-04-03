package fit.iuh.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResultResponse {
    private Long id;
    private Long assignmentId;
    private Double score;
    private LocalDateTime submittedAt;
    private boolean isLate;
}
