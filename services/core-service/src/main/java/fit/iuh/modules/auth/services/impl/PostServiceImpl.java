package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.*;
import fit.iuh.modules.auth.dtos.post.PostRequest;
import fit.iuh.modules.auth.repositories.*;
import fit.iuh.modules.auth.services.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final AttachmentRepository attachmentRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;

    // Khai báo thêm ProfileRepository để query bảng SQL
    private final ProfileRepository profileRepository;

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
                    attachmentRepository.save(attachment);

                } catch (IOException e) {
                    throw new RuntimeException("Lỗi upload file lên S3: " + e.getMessage());
                }
            }
        }
        return post;
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
                if (profile.getLastName() != null) fullName += profile.getLastName() + " ";
                if (profile.getFirstName() != null) fullName += profile.getFirstName();

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
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public void deletePost(String postId, String authorEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết để xóa"));

        if (!post.getAuthorId().equals(authorEmail)) {
            throw new RuntimeException("Bạn không có quyền xóa bài viết này");
        }

        commentRepository.deleteByPostId(postId);
        reactionRepository.deleteByTargetIdAndTargetType(postId, TargetType.POST);
        attachmentRepository.deleteByTargetIdAndTargetType(postId, AttachmentTargetType.POST);

        postRepository.deleteById(postId);
    }
}