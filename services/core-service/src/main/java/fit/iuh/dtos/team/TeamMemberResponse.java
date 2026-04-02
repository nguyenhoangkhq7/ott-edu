package fit.iuh.dtos.team;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TeamMemberResponse {
    private Long id; // TeamMember ID
    private Long accountId;
    private String fullName;
    private String email;
    private String role;
    private String avatarUrl;
    private LocalDateTime joinedAt;
}
