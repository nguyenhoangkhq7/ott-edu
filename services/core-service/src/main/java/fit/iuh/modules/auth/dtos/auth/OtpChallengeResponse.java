package fit.iuh.modules.auth.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpChallengeResponse {
    private String challengeId;
    private String maskedEmail;
    private long expiresIn;
}
