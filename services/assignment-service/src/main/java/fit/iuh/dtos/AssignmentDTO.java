package fit.iuh.dtos;

import fit.iuh.models.enums.AssignmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentDTO {
    private Long id;
    private String title;
    private String instructions;
    private Double maxScore;
    private LocalDateTime dueDate;
    private AssignmentType type;
    private Long teamId;
    private Integer durationMinutes;
    private List<QuestionDTO> questions;
}
