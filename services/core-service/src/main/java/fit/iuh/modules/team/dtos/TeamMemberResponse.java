package fit.iuh.modules.team.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberResponse {
    private Long id;
    private Long accountId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private LocalDateTime joinedAt;
}
