package fit.iuh.modules.auth.dtos.auth;

import lombok.Data;

@Data
public class LogoutRequest {
    private String refreshToken;
}
