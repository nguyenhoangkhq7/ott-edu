package fit.iuh.modules.auth.services.impl;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import fit.iuh.models.Attachment;
import fit.iuh.models.AttachmentTargetType;
import fit.iuh.models.Comment;
import fit.iuh.models.Post;
import fit.iuh.models.TargetType;
import fit.iuh.modules.auth.dtos.interaction.CommentRequest;
import fit.iuh.modules.auth.repositories.AttachmentRepository;
import fit.iuh.modules.auth.repositories.CommentRepository;
import fit.iuh.modules.auth.repositories.PostRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.ReactionRepository;
import fit.iuh.modules.auth.services.CommentService;
import fit.iuh.modules.auth.services.SocketEventService;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final AttachmentRepository attachmentRepository;
    private final ProfileRepository profileRepository;
    private final ReactionRepository reactionRepository;
    private final SocketEventService socketEventService;
    private final S3Client s3Client;

    @Value("${app.storage.s3.bucket}")
    private String bucketName;

    @Value("${app.storage.s3.region}")
    private String region;

    @Override
    @Transactional
    public Comment addComment(CommentRequest request, List<MultipartFile> files, String authorEmail) {
        // 1. Lưu Comment trước
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .authorId(authorEmail)
                .content(request.getContent())
                .replyToCommentId(request.getReplyToCommentId())
                .build();
        comment = commentRepository.save(comment);

        // 2. Upload file thật lên S3 (Nếu comment có kèm file)
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                try {
                    // CẮT ĐUÔI FILE AN TOÀN (Bọc chống lỗi khi file không có đuôi)
                    String originalFilename = file.getOriginalFilename();
                    String fileExtension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }

                    String key = "comments/" + comment.getId() + "/" + UUID.randomUUID() + fileExtension;

                    s3Client.putObject(PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                    String realUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);

                    Attachment attachment = Attachment.builder()
                            .fileName(originalFilename)
                            .fileType(file.getContentType())
                            .size(file.getSize())
                            .fileUrl(realUrl)
                            .targetId(comment.getId())
                            .targetType(AttachmentTargetType.COMMENT)
                            .build();
                    attachmentRepository.save(attachment);

                } catch (IOException e) {
                    throw new RuntimeException("Lỗi upload file comment lên S3: " + e.getMessage());
                }
            }
        }

        // ✨ EMIT SOCKET EVENT
        enrichCommentWithAuthorInfo(comment);
        Map<String, Object> commentData = new HashMap<>();
        commentData.put("id", comment.getId());
        commentData.put("authorName", comment.getAuthorName());
        commentData.put("authorId", comment.getAuthorId());
        commentData.put("authorAvatar", comment.getAuthorAvatar());
        commentData.put("content", comment.getContent());
        commentData.put("createdAt", comment.getCreatedAt());
        commentData.put("replyToCommentId", comment.getReplyToCommentId());

        socketEventService.emitCommentCreated(post.getClassId(), request.getPostId(), commentData);

        return comment;
    }

    @Override
    public List<Comment> getCommentsByPost(String postId, String currentUserEmail) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);

        for (Comment comment : comments) {
            // 1. Map File đính kèm
            List<Attachment> files = attachmentRepository.findByTargetIdAndTargetType(
                    comment.getId(), AttachmentTargetType.COMMENT);
            comment.setAttachments(files);

            // 2. Map Thông tin User (Tên, Ảnh)
            profileRepository.findByAccount_Email(comment.getAuthorId()).ifPresent(profile -> {
                comment.setAuthorName(profile.getFirstName() + " " + profile.getLastName());
                comment.setAuthorAvatar(profile.getAvatarUrl());
            });

            // 3. Map Cảm xúc của User hiện hành
            if (currentUserEmail != null) {
                reactionRepository.findByTargetIdAndTargetTypeAndAuthorId(
                        comment.getId(), TargetType.COMMENT, currentUserEmail
                ).ifPresent(reaction -> {
                    comment.setUserReaction(reaction.getType().name());
                });
            }
        }

        return comments;
    }

    @Override
    @Transactional
    public void deleteComment(String commentId, String authorEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        if (!comment.getAuthorId().equals(authorEmail)) {
            throw new RuntimeException("Bạn không có quyền xóa bình luận này");
        }

        // Trừ đi số lượng comment của Post
        Post post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postRepository.save(post);
        }

        // Xóa luôn file của comment đó khỏi DB
        attachmentRepository.deleteByTargetIdAndTargetType(commentId, AttachmentTargetType.COMMENT);

        commentRepository.delete(comment);

        // ✨ EMIT SOCKET EVENT
        if (post != null) {
            socketEventService.emitCommentDeleted(post.getClassId(), comment.getPostId(), commentId);
        }
    }

    @Override
    @Transactional
    public Comment updateComment(String commentId, String newContent, String authorEmail) {
        // 1. Tìm comment trong Database
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        // 2. Kiểm tra xem người đang sửa có phải là chủ nhân của comment không
        if (!comment.getAuthorId().equals(authorEmail)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa bình luận này");
        }

        // 3. Cập nhật nội dung mới và lưu lại
        comment.setContent(newContent);
        comment = commentRepository.save(comment);

        // ✨ EMIT SOCKET EVENT
        enrichCommentWithAuthorInfo(comment);
        Post post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            Map<String, Object> commentData = new HashMap<>();
            commentData.put("id", comment.getId());
            commentData.put("content", comment.getContent());
            commentData.put("updatedAt", comment.getUpdatedAt());
            socketEventService.emitCommentUpdated(post.getClassId(), comment.getPostId(), commentId, commentData);
        }

        return comment;
    }

    // ✨ HELPER: Enriching Comment with Author Information
    private void enrichCommentWithAuthorInfo(Comment comment) {
        profileRepository.findByAccount_Email(comment.getAuthorId()).ifPresent(profile -> {
            String fullName = "";
            if (profile.getLastName() != null) {
                fullName += profile.getLastName() + " ";
            }
            if (profile.getFirstName() != null) {
                fullName += profile.getFirstName();
            }
            comment.setAuthorName(fullName.trim());
            comment.setAuthorAvatar(profile.getAvatarUrl());
        });
    }
}
