package fit.iuh.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerOptionDTO {
    private Long id;
    private String content;
    private boolean correct;
    private Integer displayOrder;
}
