package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.*;
import fit.iuh.modules.auth.dtos.post.PostRequest;
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
class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private SocketEventService socketEventService;

    @Mock
    private S3Client s3Client;

    @InjectMocks
    private PostServiceImpl postService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(postService, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(postService, "region", "us-east-1");
    }

    @Test
    void createPost_Success_NoFiles() {
        PostRequest request = new PostRequest();
        request.setClassId("class-123");
        request.setContent("This is a post");
        request.setType(PostType.DISCUSSION);

        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .authorId("user@example.com")
                .content("This is a post")
                .type(PostType.DISCUSSION)
                .isPinned(false)
                .commentCount(0)
                .reactionCount(0)
                .build();

        Profile profile = Profile.builder()
                .firstName("Hau")
                .lastName("Tran")
                .avatarUrl("avatar-url")
                .build();

        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));

        Post result = postService.createPost(request, null, "user@example.com");

        System.out.println("✅ [createPost_Success_NoFiles] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [createPost_Success_NoFiles] - Expected ID: post-1 | Actual ID: " + result.getId());
        assertEquals("post-1", result.getId());
        System.out.println("✅ [createPost_Success_NoFiles] - Expected Type: DISCUSSION | Actual: " + result.getType());
        assertEquals(PostType.DISCUSSION, result.getType());
        verify(postRepository).save(any(Post.class));
        verify(socketEventService).emitPostCreated(eq("class-123"), anyMap());
    }

    @Test
    void createPost_Success_WithFiles() throws IOException {
        PostRequest request = new PostRequest();
        request.setClassId("class-123");
        request.setContent("Post with file");
        request.setType(PostType.ANNOUNCEMENT);

        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .authorId("user@example.com")
                .content("Post with file")
                .type(PostType.ANNOUNCEMENT)
                .build();

        Profile profile = Profile.builder().firstName("Hau").lastName("Tran").build();

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("doc.pdf");
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(100L);
        InputStream inputStream = new java.io.ByteArrayInputStream("content".getBytes());
        when(file.getInputStream()).thenReturn(inputStream);

        Attachment attachment = Attachment.builder()
                .id("att-1")
                .fileName("doc.pdf")
                .build();

        when(postRepository.save(any(Post.class))).thenReturn(post);
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        when(attachmentRepository.save(any(Attachment.class))).thenReturn(attachment);
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));

        Post result = postService.createPost(request, List.of(file), "user@example.com");

        System.out.println("✅ [createPost_Success_WithFiles] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [createPost_Success_WithFiles] - Expected Attachments Count: 1 | Actual: " + result.getAttachments().size());
        assertEquals(1, result.getAttachments().size());
        System.out.println("✅ [createPost_Success_WithFiles] - Expected Attachment File Name: doc.pdf | Actual: " + result.getAttachments().get(0).getFileName());
        assertEquals("doc.pdf", result.getAttachments().get(0).getFileName());
        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        verify(attachmentRepository).save(any(Attachment.class));
    }

    @Test
    void createPost_ThrowsRuntimeException_WhenS3UploadFails() throws IOException {
        PostRequest request = new PostRequest();
        request.setClassId("class-123");
        request.setType(PostType.DISCUSSION);

        Post post = Post.builder().id("post-1").build();

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("doc.pdf");
        when(file.getInputStream()).thenThrow(new IOException("S3 connection timeout"));

        when(postRepository.save(any(Post.class))).thenReturn(post);

        System.out.println("❌ [createPost_ThrowsRuntimeException_WhenS3UploadFails] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            postService.createPost(request, List.of(file), "user@example.com");
        });

        System.out.println("❌ [createPost_ThrowsRuntimeException_WhenS3UploadFails] - Expected Exception Message to contain: Lỗi upload file lên S3: S3 connection timeout | Actual Message: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("Lỗi upload file lên S3: S3 connection timeout"));
    }

    @Test
    void getNewsfeed_Success() {
        Post post = Post.builder()
                .id("post-1")
                .authorId("author@example.com")
                .build();
        List<Post> posts = List.of(post);

        Account account = Account.builder().email("author@example.com").build();
        Profile profile = Profile.builder()
                .firstName("Jane")
                .lastName("Doe")
                .avatarUrl("jane-avatar")
                .account(account)
                .build();

        Attachment file = Attachment.builder().id("att-1").build();
        Reaction reaction = Reaction.builder().type(ReactionType.LOVE).build();

        when(postRepository.findByClassIdOrderByCreatedAtDesc("class-123")).thenReturn(posts);
        when(profileRepository.findByAccount_EmailIn(anyList())).thenReturn(List.of(profile));
        when(attachmentRepository.findByTargetIdAndTargetType("post-1", AttachmentTargetType.POST))
                .thenReturn(List.of(file));
        when(reactionRepository.findByTargetIdAndTargetTypeAndAuthorId("post-1", TargetType.POST, "currentUser@example.com"))
                .thenReturn(Optional.of(reaction));

        List<Post> result = postService.getNewsfeed("class-123", "currentUser@example.com");

        System.out.println("✅ [getNewsfeed_Success] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [getNewsfeed_Success] - Expected Posts Count: 1 | Actual: " + result.size());
        assertEquals(1, result.size());
        Post resultPost = result.get(0);
        System.out.println("✅ [getNewsfeed_Success] - Expected Author Name: Doe Jane | Actual: " + resultPost.getAuthorName());
        assertEquals("Doe Jane", resultPost.getAuthorName());
        System.out.println("✅ [getNewsfeed_Success] - Expected Author Avatar: jane-avatar | Actual: " + resultPost.getAuthorAvatar());
        assertEquals("jane-avatar", resultPost.getAuthorAvatar());
        System.out.println("✅ [getNewsfeed_Success] - Expected User Reaction: LOVE | Actual: " + resultPost.getUserReaction());
        assertEquals("LOVE", resultPost.getUserReaction());
        System.out.println("✅ [getNewsfeed_Success] - Expected Attachments Count: 1 | Actual: " + resultPost.getAttachments().size());
        assertEquals(1, resultPost.getAttachments().size());
    }

    @Test
    void getNewsfeed_Empty() {
        when(postRepository.findByClassIdOrderByCreatedAtDesc("class-123")).thenReturn(Collections.emptyList());

        List<Post> result = postService.getNewsfeed("class-123", "currentUser@example.com");

        System.out.println("✅ [getNewsfeed_Empty] - Expected result to be empty | Actual size: " + result.size());
        assertTrue(result.isEmpty());
        verify(profileRepository, never()).findByAccount_EmailIn(any());
        verify(attachmentRepository, never()).findByTargetIdAndTargetType(any(), any());
    }

    @Test
    void updatePost_Success() {
        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .authorId("user@example.com")
                .content("Old Content")
                .type(PostType.DISCUSSION)
                .build();

        Profile profile = Profile.builder().firstName("Hau").lastName("Tran").build();
        Attachment att = Attachment.builder().id("att-1").build();

        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(attachmentRepository.findByTargetIdAndTargetType("post-1", AttachmentTargetType.POST))
                .thenReturn(List.of(att));
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(profile));

        Post result = postService.updatePost("post-1", "New Content", "user@example.com");

        System.out.println("✅ [updatePost_Success] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [updatePost_Success] - Expected Content: New Content | Actual: " + result.getContent());
        assertEquals("New Content", result.getContent());
        verify(postRepository).save(post);
        verify(socketEventService).emitPostUpdated(eq("class-123"), eq("post-1"), anyMap());
    }

    @Test
    void updatePost_ThrowsRuntimeException_WhenPostNotFound() {
        when(postRepository.findById("invalid-post")).thenReturn(Optional.empty());

        System.out.println("❌ [updatePost_ThrowsRuntimeException_WhenPostNotFound] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            postService.updatePost("invalid-post", "New Content", "user@example.com");
        });

        System.out.println("❌ [updatePost_ThrowsRuntimeException_WhenPostNotFound] - Expected Exception Message: Không tìm thấy bài viết | Actual Message: " + ex.getMessage());
        assertEquals("Không tìm thấy bài viết", ex.getMessage());
    }

    @Test
    void updatePost_ThrowsRuntimeException_WhenNotAuthor() {
        Post post = Post.builder()
                .id("post-1")
                .authorId("other@example.com")
                .build();

        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        System.out.println("❌ [updatePost_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            postService.updatePost("post-1", "New Content", "user@example.com");
        });

        System.out.println("❌ [updatePost_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception Message: Bạn không có quyền chỉnh sửa bài viết này | Actual Message: " + ex.getMessage());
        assertEquals("Bạn không có quyền chỉnh sửa bài viết này", ex.getMessage());
    }

    @Test
    void deletePost_Success() {
        Post post = Post.builder()
                .id("post-1")
                .classId("class-123")
                .authorId("user@example.com")
                .build();

        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        postService.deletePost("post-1", "user@example.com");

        System.out.println("✅ [deletePost_Success] - Expected calls: commentRepository.deleteByPostId, reactionRepository.deleteByTargetIdAndTargetType, attachmentRepository.deleteByTargetIdAndTargetType, postRepository.deleteById, and socketEventService.emitPostDeleted");
        verify(commentRepository).deleteByPostId("post-1");
        verify(reactionRepository).deleteByTargetIdAndTargetType("post-1", TargetType.POST);
        verify(attachmentRepository).deleteByTargetIdAndTargetType("post-1", AttachmentTargetType.POST);
        verify(postRepository).deleteById("post-1");
        verify(socketEventService).emitPostDeleted("class-123", "post-1");
    }

    @Test
    void deletePost_ThrowsRuntimeException_WhenPostNotFound() {
        when(postRepository.findById("invalid-post")).thenReturn(Optional.empty());

        System.out.println("❌ [deletePost_ThrowsRuntimeException_WhenPostNotFound] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            postService.deletePost("invalid-post", "user@example.com");
        });

        System.out.println("❌ [deletePost_ThrowsRuntimeException_WhenPostNotFound] - Expected Exception Message: Không tìm thấy bài viết để xóa | Actual Message: " + ex.getMessage());
        assertEquals("Không tìm thấy bài viết để xóa", ex.getMessage());
    }

    @Test
    void deletePost_ThrowsRuntimeException_WhenNotAuthor() {
        Post post = Post.builder()
                .id("post-1")
                .authorId("other@example.com")
                .build();

        when(postRepository.findById("post-1")).thenReturn(Optional.of(post));

        System.out.println("❌ [deletePost_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception: " + RuntimeException.class.getName());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            postService.deletePost("post-1", "user@example.com");
        });

        System.out.println("❌ [deletePost_ThrowsRuntimeException_WhenNotAuthor] - Expected Exception Message: Bạn không có quyền xóa bài viết này | Actual Message: " + ex.getMessage());
        assertEquals("Bạn không có quyền xóa bài viết này", ex.getMessage());
    }
}
