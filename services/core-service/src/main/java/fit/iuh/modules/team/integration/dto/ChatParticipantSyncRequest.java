package fit.iuh.modules.team.integration.dto;

public record ChatParticipantSyncRequest(
        Long accountId,
        String email,
        String fullName,
        String code,
        String avatarUrl
) {
}
