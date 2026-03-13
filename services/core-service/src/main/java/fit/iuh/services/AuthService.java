package fit.iuh.services;


import fit.iuh.dtos.auth.LoginRequest;
import fit.iuh.dtos.auth.LoginResponse;
import fit.iuh.dtos.auth.LogoutRequest;
import fit.iuh.dtos.auth.RefreshTokenRequest;
import fit.iuh.dtos.auth.RefreshTokenResponse;
import fit.iuh.dtos.auth.AuthUserResponse;
import fit.iuh.dtos.register.RegisterRequest;

public interface AuthService {
    /**
     * Đăng ký tài khoản mới cho hệ thống
     * @param request Dữ liệu từ người dùng gửi lên
     * @return Thông báo thành công
     */
    String register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    void logout(LogoutRequest request);

    AuthUserResponse getCurrentUser(String email);
}
