package fit.iuh.modules.auth.dtos.auth;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(max = 120, message = "Ho ten khong duoc vuot qua 120 ky tu.")
    private String fullName;

    @Size(max = 1000, message = "Gioi thieu khong duoc vuot qua 1000 ky tu.")
    private String about;

    @Size(max = 20, message = "So dien thoai khong duoc vuot qua 20 ky tu.")
    private String phone;

    @Size(max = 500, message = "Avatar URL khong duoc vuot qua 500 ky tu.")
    private String avatarUrl;

    private Long departmentId;
}
