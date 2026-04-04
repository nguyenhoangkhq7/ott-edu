package fit.iuh.modules.auth.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank(message = "challengeId là bắt buộc.")
    private String challengeId;

    @NotBlank(message = "Mã OTP là bắt buộc.")
    @Pattern(regexp = "^\\d{6}$", message = "Mã OTP phải gồm đúng 6 chữ số.")
    private String otpCode;

    @NotNull(message = "Mục đích xác thực OTP là bắt buộc.")
    private OtpPurpose purpose;
}
