package fit.iuh.modules.auth.dtos.auth;

import lombok.Data;

@Data
public class RefreshTokenRequest {
    private String refreshToken;
}
