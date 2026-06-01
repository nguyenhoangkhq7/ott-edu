package fit.iuh.modules.team.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamRequest {
    private String name;
    private String description;
    private String joinCode;
    private Long departmentId;
    private boolean isApprovalRequired;

    public boolean getIsApprovalRequired() {
        return isApprovalRequired;
    }

    public void setIsApprovalRequired(boolean isApprovalRequired) {
        this.isApprovalRequired = isApprovalRequired;
    }
}
