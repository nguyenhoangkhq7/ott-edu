package fit.iuh.dtos.register;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String roleName;
    private String code;

    // Nếu chọn từ danh sách, frontend sẽ gửi ID này (và custom = null)
    private Long departmentId;
    private Long schoolId;

    // Nếu chọn "Khác", frontend sẽ gửi ID = null, và truyền 2 chuỗi này lên
    private String customSchool;
    private String customDepartment;
}