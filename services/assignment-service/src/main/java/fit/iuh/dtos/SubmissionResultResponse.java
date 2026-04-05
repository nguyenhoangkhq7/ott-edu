package fit.iuh.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResultResponse {
    private Long id;
    private Long assignmentId;
    private Double score;
    private Double maxScore;
    private LocalDateTime submittedAt;
    private boolean isLate;
}
