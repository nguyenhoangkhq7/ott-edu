package fit.iuh.modules.quiz.dtos;

import lombok.Data;

@Data
public class AnswerOptionDto {
    private Long id;
    private String content;
    private Integer displayOrder;
}
