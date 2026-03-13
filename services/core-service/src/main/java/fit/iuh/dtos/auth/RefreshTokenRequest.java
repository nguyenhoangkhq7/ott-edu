package fit.iuh.dtos.auth;

import lombok.Data;

@Data
public class RefreshTokenRequest {
    private String refreshToken;
}
