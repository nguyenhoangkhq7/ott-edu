package fit.iuh.modules.auth.services.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import fit.iuh.models.Comment;
import fit.iuh.models.Post;
import fit.iuh.models.Reaction;
import fit.iuh.models.ReactionType;
import fit.iuh.models.TargetType;
import fit.iuh.modules.auth.repositories.CommentRepository;
import fit.iuh.modules.auth.repositories.PostRepository;
import fit.iuh.modules.auth.repositories.ReactionRepository;
import fit.iuh.modules.auth.services.ReactionService;
import fit.iuh.modules.auth.services.SocketEventService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    // ✨ SOCKET EVENT SERVICE
    private final SocketEventService socketEventService;

    @Override
    public void toggleReaction(String targetId, TargetType targetType, ReactionType reactionType, String authorEmail) {
        Optional<Reaction> existingOpt = reactionRepository
                .findByTargetIdAndTargetTypeAndAuthorId(targetId, targetType, authorEmail);

        boolean isNewReaction = false;
        boolean isUnliked = false;
        String classId = null;

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
                classId = post.getClassId();
                if (isNewReaction) {
                    post.setReactionCount(post.getReactionCount() + 1);
                }
                if (isUnliked) {
                    post.setReactionCount(Math.max(0, post.getReactionCount() - 1));
                }
                postRepository.save(post);
            }
        } else if (targetType == TargetType.COMMENT) {
            Comment comment = commentRepository.findById(targetId).orElse(null);
            if (comment != null) {
                Post post = postRepository.findById(comment.getPostId()).orElse(null);
                if (post != null) {
                    classId = post.getClassId();
                }
                if (isNewReaction) {
                    comment.setReactionCount(comment.getReactionCount() + 1);
                }
                if (isUnliked) {
                    comment.setReactionCount(Math.max(0, comment.getReactionCount() - 1));
                }
                commentRepository.save(comment);
            }
        }

        // ✨ EMIT SOCKET EVENT
        if (classId != null) {
            socketEventService.emitReactionUpdated(classId, targetId, reactionType.name(), isNewReaction || !isUnliked);
        }
    }
}
