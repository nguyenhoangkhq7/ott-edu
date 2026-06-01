package fit.iuh.modules.quiz.dtos;

import lombok.Data;

import java.util.List;

@Data
public class SubmitAnswerDto {
    private Long questionId;
    private List<Long> selectedOptionIds;
}
