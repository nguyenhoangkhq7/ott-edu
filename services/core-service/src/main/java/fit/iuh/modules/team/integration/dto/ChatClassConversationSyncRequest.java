package fit.iuh.modules.team.integration.dto;

import java.util.List;

public record ChatClassConversationSyncRequest(
        Long teamId,
        String name,
        String description,
        Long departmentId,
        boolean archived,
        List<ChatParticipantSyncRequest> participants
) {
}
