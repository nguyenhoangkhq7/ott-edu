package fit.iuh.modules.auth.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank(message = "verifiedToken là bắt buộc.")
    private String verifiedToken;

    @NotBlank(message = "Mật khẩu hiện tại là bắt buộc.")
    private String currentPassword;

    @NotBlank(message = "Mật khẩu mới là bắt buộc.")
    @Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự.")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu là bắt buộc.")
    private String confirmPassword;
}
