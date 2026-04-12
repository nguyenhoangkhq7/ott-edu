package fit.iuh.modules.quiz.dtos;

import lombok.Data;

@Data
public class SubmissionResultDto {
    private Long submissionId;
    private Double score;
    private Double maxScore;
    private String feedback;
    private int totalQuestions;
    private int answeredQuestions;
}
