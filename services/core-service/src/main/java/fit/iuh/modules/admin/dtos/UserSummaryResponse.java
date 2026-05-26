package fit.iuh.modules.admin.dtos;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {
    private long totalAccounts;
    private long activeNow;
    private long lockedAccounts;
}
