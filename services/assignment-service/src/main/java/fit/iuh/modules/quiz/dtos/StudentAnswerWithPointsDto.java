package fit.iuh.modules.quiz.dtos;

import lombok.Data;

import java.util.List;

/**
 * DTO for student's answer with earned points
 * 
 * Shows:
 * - Question content
 * - Student's selected options
 * - Earned points for this question
 */
@Data
public class StudentAnswerWithPointsDto {

    private Long questionId;
    private String questionContent;
    private Double questionPoints;
    private String questionType;
    private List<Long> selectedOptionIds;
    private Double earnedPoints;
}
