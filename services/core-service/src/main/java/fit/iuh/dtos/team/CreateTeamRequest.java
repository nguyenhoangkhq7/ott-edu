package fit.iuh.dtos.team;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTeamRequest {

    private String name;        // Tên lớp (bắt buộc)
    private String description; // Mô tả (tuỳ chọn)
    private Long schoolId;      // ID trường (tuỳ chọn - nếu null thì lấy từ profile)
    private Long departmentId;  // ID khoa  (tuỳ chọn)
}
