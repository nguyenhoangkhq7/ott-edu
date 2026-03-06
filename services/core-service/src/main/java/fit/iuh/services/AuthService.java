package fit.iuh.services;


import fit.iuh.dtos.register.RegisterRequest;

public interface AuthService {
    /**
     * Đăng ký tài khoản mới cho hệ thống
     * @param request Dữ liệu từ người dùng gửi lên
     * @return Thông báo thành công
     */
    String register(RegisterRequest request);
}
