package fit.iuh.modules.auth.services;

import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.dtos.auth.ChangePasswordRequest;
import fit.iuh.modules.auth.dtos.auth.ForgotPasswordRequest;
import fit.iuh.modules.auth.dtos.auth.LoginRequest;
import fit.iuh.modules.auth.dtos.auth.LoginResponse;
import fit.iuh.modules.auth.dtos.auth.LogoutRequest;
import fit.iuh.modules.auth.dtos.auth.OtpChallengeResponse;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenResponse;
import fit.iuh.modules.auth.dtos.auth.ResetPasswordRequest;
import fit.iuh.modules.auth.dtos.auth.VerifyOtpRequest;
import fit.iuh.modules.auth.dtos.auth.VerifyOtpResponse;
import fit.iuh.modules.auth.dtos.register.RegisterRequest;

public interface AuthService {
    String register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    void logout(LogoutRequest request);

    AuthUserResponse getCurrentUser(String email);

    OtpChallengeResponse forgotPassword(ForgotPasswordRequest request);

    OtpChallengeResponse sendChangePasswordOtp(String email);

    VerifyOtpResponse verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(String email, ChangePasswordRequest request);
}
