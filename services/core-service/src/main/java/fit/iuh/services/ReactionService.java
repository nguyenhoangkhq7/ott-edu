package fit.iuh.services;
import fit.iuh.models.enums.ReactionType;
import fit.iuh.models.enums.TargetType;

public interface ReactionService {
    void toggleReaction(String targetId, TargetType targetType, ReactionType reactionType, String authorEmail);
}