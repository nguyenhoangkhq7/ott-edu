package fit.iuh.dtos;

import fit.iuh.models.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {
    private Long id;
    private String content;
    private Double points;
    private QuestionType questionType;
    private List<AnswerOptionDTO> options;
}
