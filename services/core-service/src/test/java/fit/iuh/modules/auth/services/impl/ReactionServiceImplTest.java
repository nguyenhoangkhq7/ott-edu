package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.*;
import fit.iuh.modules.auth.repositories.CommentRepository;
import fit.iuh.modules.auth.repositories.PostRepository;
import fit.iuh.modules.auth.repositories.ReactionRepository;
import fit.iuh.modules.auth.services.SocketEventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReactionServiceImplTest {

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private SocketEventService socketEventService;

    @InjectMocks
    private ReactionServiceImpl reactionService;

    @Test
    void toggleReaction_NewReactionOnPost_Success() {
        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .reactionCount(0)
                .build();

        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("post-1", TargetType.POST, "user@example.com"))
                .thenReturn(Optional.empty());
        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        reactionService.toggleReaction("post-1", TargetType.POST, ReactionType.LIKE, "user@example.com");

        System.out.println("✅ [toggleReaction_NewReactionOnPost_Success] - Expected Reaction Count: 1 | Actual: " + post.getReactionCount());
        assertEquals(1, post.getReactionCount());
        verify(reactionRepository).save(any(Reaction.class));
        verify(postRepository).save(post);
        verify(socketEventService).emitReactionUpdated("class-123", "post-1", "LIKE", true);
    }

    @Test
    void toggleReaction_RemoveSameReactionOnPost_Success() {
        Reaction existingReaction = Reaction.builder()
                .id("react-1")
                .targetId("post-1")
                .targetType(TargetType.POST)
                .authorId("user@example.com")
                .type(ReactionType.LIKE)
                .build();

        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .reactionCount(2)
                .build();

        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("post-1", TargetType.POST, "user@example.com"))
                .thenReturn(Optional.of(existingReaction));
        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        reactionService.toggleReaction("post-1", TargetType.POST, ReactionType.LIKE, "user@example.com");

        System.out.println("✅ [toggleReaction_RemoveSameReactionOnPost_Success] - Expected Reaction Count: 1 | Actual: " + post.getReactionCount());
        assertEquals(1, post.getReactionCount());
        verify(reactionRepository).delete(existingReaction);
        verify(postRepository).save(post);
        verify(socketEventService).emitReactionUpdated("class-123", "post-1", "LIKE", false);
    }

    @Test
    void toggleReaction_ChangeReactionTypeOnPost_Success() {
        Reaction existingReaction = Reaction.builder()
                .id("react-1")
                .targetId("post-1")
                .targetType(TargetType.POST)
                .authorId("user@example.com")
                .type(ReactionType.LOVE)
                .build();

        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .reactionCount(2)
                .build();

        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("post-1", TargetType.POST, "user@example.com"))
                .thenReturn(Optional.of(existingReaction));
        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        reactionService.toggleReaction("post-1", TargetType.POST, ReactionType.LIKE, "user@example.com");

        System.out.println("✅ [toggleReaction_ChangeReactionTypeOnPost_Success] - Expected Reaction Count: 2 | Actual: " + post.getReactionCount());
        assertEquals(2, post.getReactionCount()); // Count doesn't change
        System.out.println("✅ [toggleReaction_ChangeReactionTypeOnPost_Success] - Expected Reaction Type: LIKE | Actual: " + existingReaction.getType());
        assertEquals(ReactionType.LIKE, existingReaction.getType());
        verify(reactionRepository).save(existingReaction);
        verify(postRepository).save(post);
        verify(socketEventService).emitReactionUpdated("class-123", "post-1", "LIKE", true);
    }

    @Test
    void toggleReaction_NewReactionOnComment_Success() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .postId("post-1")
                .reactionCount(0)
                .build();

        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .build();

        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("comment-1", TargetType.COMMENT, "user@example.com"))
                .thenReturn(Optional.empty());
        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(comment));
        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        reactionService.toggleReaction("comment-1", TargetType.COMMENT, ReactionType.HAHA, "user@example.com");

        System.out.println("✅ [toggleReaction_NewReactionOnComment_Success] - Expected Reaction Count: 1 | Actual: " + comment.getReactionCount());
        assertEquals(1, comment.getReactionCount());
        verify(reactionRepository).save(any(Reaction.class));
        verify(commentRepository).save(comment);
        verify(socketEventService).emitReactionUpdated("class-123", "comment-1", "HAHA", true);
    }

    @Test
    void toggleReaction_PostNotFound_NoException() {
        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("invalid-post", TargetType.POST, "user@example.com"))
                .thenReturn(Optional.empty());
        when(postRepository.findById("invalid-post")).thenReturn(Optional.empty());

        System.out.println("✅ [toggleReaction_PostNotFound_NoException] - Expected no exception to be thrown");
        assertDoesNotThrow(() -> {
            reactionService.toggleReaction("invalid-post", TargetType.POST, ReactionType.LIKE, "user@example.com");
        });

        verify(reactionRepository).save(any(Reaction.class));
        verify(postRepository, never()).save(any());
        verify(socketEventService, never()).emitReactionUpdated(any(), any(), any(), anyBoolean());
    }

    @Test
    void toggleReaction_CommentNotFound_NoException() {
        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("invalid-comment", TargetType.COMMENT, "user@example.com"))
                .thenReturn(Optional.empty());
        when(commentRepository.findById("invalid-comment")).thenReturn(Optional.empty());

        System.out.println("✅ [toggleReaction_CommentNotFound_NoException] - Expected no exception to be thrown");
        assertDoesNotThrow(() -> {
            reactionService.toggleReaction("invalid-comment", TargetType.COMMENT, ReactionType.HAHA, "user@example.com");
        });

        verify(reactionRepository).save(any(Reaction.class));
        verify(commentRepository, never()).save(any());
        verify(socketEventService, never()).emitReactionUpdated(any(), any(), any(), anyBoolean());
    }
}
