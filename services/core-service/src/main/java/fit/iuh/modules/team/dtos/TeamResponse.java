package fit.iuh.modules.team.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {
    private Long id;
    private String name;
    private String description;
    private String joinCode;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;
    private Long departmentId;
    private boolean isApprovalRequired;

    public boolean getIsApprovalRequired() {
        return isApprovalRequired;
    }

    private String creatorRole;
    private List<TeamMemberResponse> members;
}
