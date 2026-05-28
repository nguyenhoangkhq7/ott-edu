package fit.iuh.modules.admin.dtos;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long accountId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String status; // "Active" or "Locked"
    private String createdDate; // e.g. "Oct 12, 2023"
    private String avatarUrl;
    private Long schoolId;
    private String schoolName;
    private Long departmentId;
    private String departmentName;
}
