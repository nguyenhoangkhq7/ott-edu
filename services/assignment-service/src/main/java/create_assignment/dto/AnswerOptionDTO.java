package create_assignment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerOptionDTO {
    private String content;

    @JsonProperty("isCorrect")
    private Boolean isCorrect;
}
