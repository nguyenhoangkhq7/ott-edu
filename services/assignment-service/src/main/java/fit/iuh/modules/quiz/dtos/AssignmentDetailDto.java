package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.AssignmentType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignmentDetailDto {
    private Long id;
    private String title;
    private String instructions;
    private Double maxScore;
    private LocalDateTime dueDate;
    private AssignmentType type;
    private List<Long> teamIds;
    private List<QuestionDto> questions;
}
