package fit.iuh.dtos.team;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamResponse {

    private Long          id;
    private String        name;
    private String        description;
    private String        joinCode;
    private boolean       isActive;
    private LocalDateTime createdAt;

    // Thông tin Trường
    private Long   schoolId;
    private String schoolName;

    // Thông tin Khoa
    private Long   departmentId;
    private String departmentName;

    // Số lượng thành viên
    private int memberCount;
}
