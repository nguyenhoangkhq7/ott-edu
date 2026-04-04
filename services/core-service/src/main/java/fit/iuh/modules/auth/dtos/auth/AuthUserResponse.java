package fit.iuh.modules.auth.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserResponse {
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
    private Long departmentId;
    private String departmentName;
}
