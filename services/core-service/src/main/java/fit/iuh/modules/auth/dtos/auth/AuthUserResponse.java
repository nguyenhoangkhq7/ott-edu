package fit.iuh.modules.auth.dtos.auth;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserResponse {

    // Thêm các trường này để mapping
    private Long id;
    private String fullName;

    // Các trường cũ
    private Long accountId;
    private String email;
    private String status;
    private List<String> roles;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String bio;
    private String phone;
    private String code;
    private Long schoolId;
    private String schoolName;
    private Long departmentId;
    private String departmentName;

    private List<TeamResponse> teams;
}
