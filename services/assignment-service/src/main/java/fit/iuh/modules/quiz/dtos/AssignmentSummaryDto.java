package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.AssignmentType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class AssignmentSummaryDto {
    private Long id;
    private String title;
    private String instructions;
    private Double maxScore;
    private LocalDateTime dueDate;
    private AssignmentType type;
    private List<Long> teamIds;
    private LocalDateTime archivedAt;
}
