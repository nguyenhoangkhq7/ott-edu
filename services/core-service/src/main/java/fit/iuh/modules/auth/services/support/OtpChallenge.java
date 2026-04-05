package fit.iuh.modules.auth.services.support;

import fit.iuh.modules.auth.dtos.auth.OtpPurpose;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OtpChallenge {
    private String id;
    private String email;
    private OtpPurpose purpose;
    private String otpHash;
    private LocalDateTime expiresAt;
    private int attempts;
    private int maxAttempts;
    private boolean used;
}
