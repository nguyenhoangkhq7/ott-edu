package fit.iuh.dtos.register;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    // Chuyền lên ROLE_STUDENT hoặc ROLE_TEACHER
    private String roleName;
}