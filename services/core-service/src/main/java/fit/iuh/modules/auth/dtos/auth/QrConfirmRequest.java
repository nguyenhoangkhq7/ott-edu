package fit.iuh.modules.auth.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrConfirmRequest {
    @NotBlank(message = "Session ID không được trống.")
    private String sessionId;
}
