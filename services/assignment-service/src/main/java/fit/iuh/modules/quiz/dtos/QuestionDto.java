package fit.iuh.modules.quiz.dtos;

import fit.iuh.modules.quiz.models.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuestionDto {
    private Long id;
    private String content;
    private QuestionType type;
    private Double points;
    private Integer displayOrder;
    private List<AnswerOptionDto> options;
}
