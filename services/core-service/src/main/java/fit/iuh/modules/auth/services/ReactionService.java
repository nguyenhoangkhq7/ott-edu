package fit.iuh.modules.auth.services;


import fit.iuh.models.ReactionType;
import fit.iuh.models.TargetType;

public interface ReactionService {
    void toggleReaction(String targetId, TargetType targetType, ReactionType reactionType, String authorEmail);
}