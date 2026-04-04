package fit.iuh.services.impl;

import fit.iuh.models.Comment;
import fit.iuh.models.Post;
import fit.iuh.models.Reaction;
import fit.iuh.models.enums.ReactionType;
import fit.iuh.models.enums.TargetType;
import fit.iuh.repositories.CommentRepository;
import fit.iuh.repositories.PostRepository;
import fit.iuh.repositories.ReactionRepository;
import fit.iuh.services.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @Override
    public void toggleReaction(String targetId, TargetType targetType, ReactionType reactionType, String authorEmail) {
        Optional<Reaction> existingOpt = reactionRepository
                .findByTargetIdAndTargetTypeAndAuthorId(targetId, targetType, authorEmail);

        boolean isNewReaction = false;
        boolean isUnliked = false;

        if (existingOpt.isPresent()) {
            Reaction existing = existingOpt.get();
            if (existing.getType() == reactionType) {
                reactionRepository.delete(existing);
                isUnliked = true;
            } else {
                existing.setType(reactionType);
                reactionRepository.save(existing);
            }
        } else {
            Reaction newReaction = Reaction.builder()
                    .targetId(targetId).targetType(targetType)
                    .authorId(authorEmail).type(reactionType).build();
            reactionRepository.save(newReaction);
            isNewReaction = true;
        }

        if (targetType == TargetType.POST) {
            Post post = postRepository.findById(targetId).orElse(null);
            if (post != null) {
                if (isNewReaction) post.setReactionCount(post.getReactionCount() + 1);
                if (isUnliked) post.setReactionCount(Math.max(0, post.getReactionCount() - 1));
                postRepository.save(post);
            }
        } else if (targetType == TargetType.COMMENT) {
            Comment comment = commentRepository.findById(targetId).orElse(null);
            if (comment != null) {
                if (isNewReaction) comment.setReactionCount(comment.getReactionCount() + 1);
                if (isUnliked) comment.setReactionCount(Math.max(0, comment.getReactionCount() - 1));
                commentRepository.save(comment);
            }
        }
    }
}