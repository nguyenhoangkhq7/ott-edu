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
    private List<String> roles;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String code;
    private Long schoolId;
    private Long departmentId;
}
