package fit.iuh.dtos.auth;

import lombok.Data;

@Data
public class LogoutRequest {
    private String refreshToken;
}
