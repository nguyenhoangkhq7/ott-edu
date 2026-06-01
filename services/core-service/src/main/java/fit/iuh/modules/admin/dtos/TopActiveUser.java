package fit.iuh.modules.admin.dtos;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopActiveUser {
    private Long accountId;
    private String name;
    private String email;
    private String avatarUrl;
    private String lastActivity;
    private int messages;
    private int engagement;
}
