package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.*;
import fit.iuh.modules.auth.dtos.interaction.CommentRequest;
import fit.iuh.modules.auth.repositories.*;
import fit.iuh.modules.auth.services.SocketEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private SocketEventService socketEventService;

    @Mock
    private S3Client s3Client;

    @InjectMocks
    private CommentServiceImpl commentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(commentService, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(commentService, "region", "us-east-1");
    }

    @Test
    void addComment_Success_NoFiles() {
        CommentRequest request = new CommentRequest();
        request.setPostId("post-123");
        request.setContent("This is a comment");

        Post post = Post.builder()
                .id("post-123")
                .classId("class-123")
                .commentCount(5)
                .build();

        Comment comment = Comment.builder()
                .id("comment-1")
                .postId("post-123")
                .authorId("user@example.com")
                .content("This is a comment")
                .build();

        Profile profile = Profile.builder()
                .firstName("Hau")
                .lastName("Tran")
                .avatarUrl("avatar-url")
                .build();

        when(postRepository.findById("post-123")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));

        Comment result = commentService.addComment(request, null, "user@example.com");

        System.out.println("✅ [addComment_Success_NoFiles] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [addComment_Success_NoFiles] - Expected ID: comment-1 | Actual ID: " + result.getId());
        assertEquals("comment-1", result.getId());
        System.out.println("✅ [addComment_Success_NoFiles] - Expected Post Comment Count: 6 | Actual: " + post.getCommentCount());
        assertEquals(6, post.getCommentCount());
        verify(postRepository).save(post);
        verify(commentRepository).save(any(Comment.class));
        verify(socketEventService).emitCommentCreated(eq("class-123"), eq("post-123"), anyMap());
    }

    @Test
    void addComment_Success_WithFiles() throws IOException {
        CommentRequest request = new CommentRequest();
        request.setPostId("post-123");
        request.setContent("This is a comment with file");

        Post post = Post.builder()
                .id("post-123")
                .classId("class-123")
                .commentCount(5)
                .build();

        Comment comment = Comment.builder()
                .id("comment-1")
                .postId("post-123")
                .authorId("user@example.com")
                .content("This is a comment with file")
                .build();

        Profile profile = Profile.builder()
                .firstName("Hau")
                .lastName("Tran")
                .avatarUrl("avatar-url")
                .build();

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("image.png");
        when(file.getContentType()).thenReturn("image/png");
        when(file.getSize()).thenReturn(200L);
        InputStream inputStream = new java.io.ByteArrayInputStream("image data".getBytes());
        when(file.getInputStream()).thenReturn(inputStream);

        when(postRepository.findById("post-123")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));

        Comment result = commentService.addComment(request, List.of(file), "user@example.com");

        System.out.println("✅ [addComment_Success_WithFiles] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        verify(attachmentRepository).save(any(Attachment.class));
        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void addComment_ThrowsRuntimeException_WhenPostNotFound() {
        CommentRequest request = new CommentRequest();
        request.setPostId("invalid-post");

        when(postRepository.findById("invalid-post")).thenReturn(Optional.empty());

        System.out.println("❌ [addComment_ThrowsRuntimeException_WhenPostNotFound] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            commentService.addComment(request, null, "user@example.com");
        });

        System.out.println("❌ [addComment_ThrowsRuntimeException_WhenPostNotFound] - Expected Exception Message: Không tìm thấy bài viết | Actual Message: " + ex.getMessage());
        assertEquals("Không tìm thấy bài viết", ex.getMessage());
        verify(commentRepository, never()).save(any());
    }

    @Test
    void addComment_ThrowsRuntimeException_WhenS3UploadFails() throws IOException {
        CommentRequest request = new CommentRequest();
        request.setPostId("post-123");

        Post post = Post.builder().id("post-123").classId("class-123").commentCount(0).build();
        Comment comment = Comment.builder().id("comment-1").postId("post-123").authorId("user@example.com").build();

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("image.png");
        when(file.getInputStream()).thenThrow(new IOException("S3 connection error"));

        when(postRepository.findById("post-123")).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        System.out.println("❌ [addComment_ThrowsRuntimeException_WhenS3UploadFails] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            commentService.addComment(request, List.of(file), "user@example.com");
        });

        System.out.println("❌ [addComment_ThrowsRuntimeException_WhenS3UploadFails] - Expected Exception Message to contain: Lỗi upload file comment lên S3: S3 connection error | Actual Message: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("Lỗi upload file comment lên S3: S3 connection error"));
    }

    @Test
    void getCommentsByPost_Success_WithCurrentUser() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .authorId("user@example.com")
                .build();
        List<Comment> comments = List.of(comment);

        Attachment attachment = Attachment.builder().id("att-1").build();
        Profile profile = Profile.builder().firstName("Hau").lastName("Tran").avatarUrl("avatar-url").build();
        Reaction reaction = Reaction.builder().type(ReactionType.LIKE).build();

        when(commentRepository.findByPostIdOrderByCreatedAtAsc("post-123")).thenReturn(comments);
        when(attachmentRepository.findByTargetIdAndTargetType("comment-1", AttachmentTargetType.COMMENT))
                .thenReturn(List.of(attachment));
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));
        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("comment-1", TargetType.COMMENT, "current@example.com"))
                .thenReturn(Optional.of(reaction));

        List<Comment> result = commentService.getCommentsByPost("post-123", "current@example.com");

        System.out.println("✅ [getCommentsByPost_Success_WithCurrentUser] - Expected result size: 1 | Actual: " + result.size());
        assertEquals(1, result.size());
        System.out.println("✅ [getCommentsByPost_Success_WithCurrentUser] - Expected author: Hau Tran | Actual: " + result.get(0).getAuthorName());
        assertEquals("Hau Tran", result.get(0).getAuthorName());
        System.out.println("✅ [getCommentsByPost_Success_WithCurrentUser] - Expected avatar: avatar-url | Actual: " + result.get(0).getAuthorAvatar());
        assertEquals("avatar-url", result.get(0).getAuthorAvatar());
        System.out.println("✅ [getCommentsByPost_Success_WithCurrentUser] - Expected user reaction: LIKE | Actual: " + result.get(0).getUserReaction());
        assertEquals("LIKE", result.get(0).getUserReaction());
        System.out.println("✅ [getCommentsByPost_Success_WithCurrentUser] - Expected attachments size: 1 | Actual: " + result.get(0).getAttachments().size());
        assertEquals(1, result.get(0).getAttachments().size());
    }

    @Test
    void getCommentsByPost_Success_NoCurrentUser() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .authorId("user@example.com")
                .build();

        when(commentRepository.findByPostIdOrderByCreatedAtAsc("post-123")).thenReturn(List.of(comment));
        when(attachmentRepository.findByTargetIdAndTargetType("comment-1", AttachmentTargetType.COMMENT))
                .thenReturn(Collections.emptyList());
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.empty());

        List<Comment> result = commentService.getCommentsByPost("post-123", null);

        System.out.println("✅ [getCommentsByPost_Success_NoCurrentUser] - Expected result size: 1 | Actual: " + result.size());
        assertEquals(1, result.size());
        System.out.println("✅ [getCommentsByPost_Success_NoCurrentUser] - Expected user reaction: null | Actual: " + result.get(0).getUserReaction());
        assertNull(result.get(0).getUserReaction());
        verify(reactionRepository, never()).findByTargetIdAndTargetTypeAndAuthorId(any(), any(), any());
    }

    @Test
    void deleteComment_Success() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .postId("post-123")
                .authorId("user@example.com")
                .build();

        Post post = Post.builder().id("post-123").classId("class-123").commentCount(3).build();

        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(comment));
        when(postRepository.findById("post-123")).thenReturn(Optional.of(post));

        commentService.deleteComment("comment-1", "user@example.com");

        System.out.println("✅ [deleteComment_Success] - Expected Post Comment Count: 2 | Actual: " + post.getCommentCount());
        assertEquals(2, post.getCommentCount());
        verify(postRepository).save(post);
        verify(attachmentRepository).deleteByTargetIdAndTargetType("comment-1", AttachmentTargetType.COMMENT);
        verify(commentRepository).delete(comment);
        verify(socketEventService).emitCommentDeleted("class-123", "post-123", "comment-1");
    }

    @Test
    void deleteComment_ThrowsRuntimeException_WhenCommentNotFound() {
        when(commentRepository.findById("invalid-comment")).thenReturn(Optional.empty());

        System.out.println("❌ [deleteComment_ThrowsRuntimeException_WhenCommentNotFound] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            commentService.deleteComment("invalid-comment", "user@example.com");
        });

        System.out.println("❌ [deleteComment_ThrowsRuntimeException_WhenCommentNotFound] - Expected Exception Message: Không tìm thấy bình luận | Actual Message: " + ex.getMessage());
        assertEquals("Không tìm thấy bình luận", ex.getMessage());
        verify(commentRepository, never()).delete(any());
    }

    @Test
    void deleteComment_ThrowsRuntimeException_WhenNotAuthor() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .authorId("other@example.com")
                .build();

        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(comment));

        System.out.println("❌ [deleteComment_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            commentService.deleteComment("comment-1", "user@example.com");
        });

        System.out.println("❌ [deleteComment_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception Message: Bạn không có quyền xóa bình luận này | Actual Message: " + ex.getMessage());
        assertEquals("Bạn không có quyền xóa bình luận này", ex.getMessage());
        verify(commentRepository, never()).delete(any());
    }

    @Test
    void updateComment_Success() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .postId("post-123")
                .authorId("user@example.com")
                .content("Old Content")
                .build();

        Post post = Post.builder().id("post-123").classId("class-123").build();
        Profile profile = Profile.builder().firstName("Hau").lastName("Tran").build();

        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));
        when(postRepository.findById("post-123")).thenReturn(Optional.of(post));

        Comment result = commentService.updateComment("comment-1", "New Content", "user@example.com");

        System.out.println("✅ [updateComment_Success] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [updateComment_Success] - Expected content: New Content | Actual content: " + result.getContent());
        assertEquals("New Content", result.getContent());
        verify(commentRepository).save(comment);
        verify(socketEventService).emitCommentUpdated(eq("class-123"), eq("post-123"), eq("comment-1"), anyMap());
    }

    @Test
    void updateComment_ThrowsRuntimeException_WhenCommentNotFound() {
        when(commentRepository.findById("invalid-comment")).thenReturn(Optional.empty());

        System.out.println("❌ [updateComment_ThrowsRuntimeException_WhenCommentNotFound] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            commentService.updateComment("invalid-comment", "New Content", "user@example.com");
        });

        System.out.println("❌ [updateComment_ThrowsRuntimeException_WhenCommentNotFound] - Expected Exception Message: Không tìm thấy bình luận | Actual Message: " + ex.getMessage());
        assertEquals("Không tìm thấy bình luận", ex.getMessage());
    }

    @Test
    void updateComment_ThrowsRuntimeException_WhenNotAuthor() {
        Comment comment = Comment.builder()
                .id("comment-1")
                .authorId("other@example.com")
                .build();

        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(comment));

        System.out.println("❌ [updateComment_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            commentService.updateComment("comment-1", "New Content", "user@example.com");
        });

        System.out.println("❌ [updateComment_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception Message: Bạn không có quyền chỉnh sửa bình luận này | Actual Message: " + ex.getMessage());
        assertEquals("Bạn không có quyền chỉnh sửa bình luận này", ex.getMessage());
    }
}
