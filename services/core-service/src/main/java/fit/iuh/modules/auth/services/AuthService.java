package fit.iuh.modules.auth.services;

import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.dtos.auth.ChangePasswordRequest;
import fit.iuh.modules.auth.dtos.auth.LoginRequest;
import fit.iuh.modules.auth.dtos.auth.LoginResponse;
import fit.iuh.modules.auth.dtos.auth.LogoutRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenResponse;
import fit.iuh.modules.auth.dtos.register.RegisterRequest;

public interface AuthService {
    String register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    void logout(LogoutRequest request);

    AuthUserResponse getCurrentUser(String email);

    void changePassword(String email, ChangePasswordRequest request);
}
