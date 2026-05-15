package fit.iuh.modules.auth.services.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import fit.iuh.models.Attachment;
import fit.iuh.models.AttachmentTargetType;
import fit.iuh.models.Post;
import fit.iuh.models.Profile;
import fit.iuh.models.TargetType;
import fit.iuh.modules.auth.dtos.post.PostRequest;
import fit.iuh.modules.auth.repositories.AttachmentRepository;
import fit.iuh.modules.auth.repositories.CommentRepository;
import fit.iuh.modules.auth.repositories.PostRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.ReactionRepository;
import fit.iuh.modules.auth.services.PostService;
import fit.iuh.modules.auth.services.SocketEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // ✨ Bổ sung thư viện Log
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
@Slf4j // ✨ Thêm Annotation log để in thông báo ra console
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final AttachmentRepository attachmentRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;

    // Khai báo thêm ProfileRepository để query bảng SQL
    private final ProfileRepository profileRepository;

    // ✨ SOCKET EVENT SERVICE
    private final SocketEventService socketEventService;

    // TÍCH HỢP S3 CLIENT
    private final S3Client s3Client;

    @Value("${app.storage.s3.bucket}")
    private String bucketName;

    @Value("${app.storage.s3.region}")
    private String region;

    @Override
    @Transactional
    public Post createPost(PostRequest request, List<MultipartFile> files, String authorEmail) {
        Post post = Post.builder()
                .classId(request.getClassId())
                .authorId(authorEmail)
                .content(request.getContent())
                .type(request.getType())
                .isPinned(false)
                .commentCount(0)
                .reactionCount(0)
                .build();

        post = postRepository.save(post);
        List<Attachment> uploadedFiles = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                try {
                    // 1. Tạo tên file duy nhất trên S3
                    String fileExtension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
                    String key = "posts/" + post.getId() + "/" + UUID.randomUUID() + fileExtension;

                    // 2. Upload file lên S3
                    s3Client.putObject(PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                    // 3. Lấy đường link thật (Real URL)
                    String realUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);

                    // 4. Lưu thông tin vào DB
                    Attachment attachment = Attachment.builder()
                            .fileName(file.getOriginalFilename())
                            .fileType(file.getContentType())
                            .size(file.getSize())
                            .fileUrl(realUrl)
                            .targetId(post.getId())
                            .targetType(AttachmentTargetType.POST)
                            .build();
                    attachment = attachmentRepository.save(attachment);
                    uploadedFiles.add(attachment); // Đưa vào mảng để gửi realtime

                } catch (IOException e) {
                    throw new RuntimeException("Lỗi upload file lên S3: " + e.getMessage());
                }
            }
        }
        post.setAttachments(uploadedFiles);

        // ✨ EMIT SOCKET EVENT - Bắn TRỌN VẸN object Post
        enrichPostWithAuthorInfo(post);
        Map<String, Object> postData = new HashMap<>();
        // Thay vì gắn tay từng trường, mình có thể bọc toàn bộ thông tin quan trọng vào
        postData.put("id", post.getId());
        postData.put("classId", post.getClassId());
        postData.put("authorName", post.getAuthorName());
        postData.put("authorId", post.getAuthorId());
        postData.put("authorAvatar", post.getAuthorAvatar());
        postData.put("content", post.getContent());
        postData.put("type", post.getType());
        postData.put("isPinned", post.getIsPinned());
        postData.put("commentCount", post.getCommentCount());
        postData.put("reactionCount", post.getReactionCount());
        postData.put("createdAt", post.getCreatedAt());
        postData.put("attachments", post.getAttachments());

        socketEventService.emitPostCreated(post.getClassId(), postData);
        log.info("✓ [PostService] Bắn tín hiệu tạo Post (ID: {}) tới SocketEventService", post.getId());

        return post;
    }

    // ✨ HELPER: Enriching Post with Author Information
    private void enrichPostWithAuthorInfo(Post post) {
        profileRepository.findByAccount_Email(post.getAuthorId()).ifPresent(profile -> {
            String fullName = "";
            if (profile.getLastName() != null) {
                fullName += profile.getLastName() + " ";
            }
            if (profile.getFirstName() != null) {
                fullName += profile.getFirstName();
            }
            post.setAuthorName(fullName.trim());
            post.setAuthorAvatar(profile.getAvatarUrl());
        });
    }

    @Override
    public List<Post> getNewsfeed(String classId) {
        // 1. Lấy danh sách bài viết từ MongoDB
        List<Post> posts = postRepository.findByClassIdOrderByCreatedAtDesc(classId);

        if (posts.isEmpty()) {
            return posts;
        }

        // 2. Gom tất cả email (authorId) lại thành 1 Set (không trùng lặp)
        Set<String> authorEmails = posts.stream()
                .map(Post::getAuthorId)
                .collect(Collectors.toSet());

        // 3. Truy vấn MySQL để lấy Profile một lần duy nhất
        List<Profile> profiles = profileRepository.findByAccount_EmailIn(new ArrayList<>(authorEmails));

        // 4. Tạo Map<Email, Profile> để tra cứu siêu tốc
        Map<String, Profile> profileMap = profiles.stream()
                .collect(Collectors.toMap(
                        p -> p.getAccount().getEmail(),
                        p -> p
                ));

        // 5. Gắn File đính kèm và Tên thật cho từng bài post
        for (Post post : posts) {
            // Gắn file
            List<Attachment> files = attachmentRepository.findByTargetIdAndTargetType(
                    post.getId(),
                    AttachmentTargetType.POST
            );
            post.setAttachments(files);

            // Gắn Tên và Avatar
            Profile profile = profileMap.get(post.getAuthorId());
            if (profile != null) {
                // Nối LastName và FirstName
                String fullName = "";
                if (profile.getLastName() != null) {
                    fullName += profile.getLastName() + " ";
                }
                if (profile.getFirstName() != null) {
                    fullName += profile.getFirstName();
                }

                post.setAuthorName(fullName.trim());
                post.setAuthorAvatar(profile.getAvatarUrl());
            } else {
                // Nếu User chưa cập nhật Profile thì hiện tạm Email
                post.setAuthorName(post.getAuthorId());
            }
        }

        return posts;
    }

    @Override
    @Transactional
    public Post updatePost(String postId, String newContent, String authorEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        if (!post.getAuthorId().equals(authorEmail)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa bài viết này");
        }

        post.setContent(newContent);
        post = postRepository.save(post);

        // Lấy lại danh sách file cũ để gửi sang Realtime
        List<Attachment> files = attachmentRepository.findByTargetIdAndTargetType(post.getId(), AttachmentTargetType.POST);
        post.setAttachments(files);

        // ✨ EMIT SOCKET EVENT
        enrichPostWithAuthorInfo(post);
        Map<String, Object> postData = new HashMap<>();
        postData.put("id", post.getId());
        postData.put("classId", post.getClassId());
        postData.put("authorName", post.getAuthorName());
        postData.put("authorAvatar", post.getAuthorAvatar());
        postData.put("content", post.getContent());
        postData.put("type", post.getType());
        postData.put("attachments", post.getAttachments());
        postData.put("updatedAt", post.getUpdatedAt());

        socketEventService.emitPostUpdated(post.getClassId(), postId, postData);
        log.info("✓ [PostService] Bắn tín hiệu sửa Post (ID: {}) tới SocketEventService", post.getId());

        return post;
    }

    @Override
    @Transactional
    public void deletePost(String postId, String authorEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết để xóa"));

        if (!post.getAuthorId().equals(authorEmail)) {
            throw new RuntimeException("Bạn không có quyền xóa bài viết này");
        }

        String classId = post.getClassId();

        commentRepository.deleteByPostId(postId);
        reactionRepository.deleteByTargetIdAndTargetType(postId, TargetType.POST);
        attachmentRepository.deleteByTargetIdAndTargetType(postId, AttachmentTargetType.POST);

        postRepository.deleteById(postId);

        // ✨ EMIT SOCKET EVENT
        socketEventService.emitPostDeleted(classId, postId);
        log.info("✓ [PostService] Bắn tín hiệu xóa Post (ID: {}) tới SocketEventService", postId);
    }
}
