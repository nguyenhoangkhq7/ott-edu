package fit.iuh.modules.auth.dtos.register;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String roleName;
    private String code;

    private Long departmentId;
    private Long schoolId;

    private String customSchool;
    private String customDepartment;
}
