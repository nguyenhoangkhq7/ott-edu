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

    // NEW: materialUrls - AWS S3 links for reference materials
    private List<String> materialUrls;

    // NEW: maxAttempts - quiz attempt limit
    private Integer maxAttempts;

    // NEW: timeLimit - quiz time limit in minutes (null = unlimited)
    private Integer timeLimit;

    // NEW: showScoreAfterSubmit - whether students can see their score after submitting
    private Boolean showScoreAfterSubmit;

    // NEW: showAnswersAfterSubmit - whether students can review their answers after submitting
    private Boolean showAnswersAfterSubmit;
}
