package fit.iuh.modules.team.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamStatusRequest {
    @JsonProperty("isActive")
    private boolean isActive;
}
