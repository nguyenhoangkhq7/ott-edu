package scoring_feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeRequest {

    @NotNull(message = "Score không được để trống")
    private Double score;

    private String feedback;
}