package fit.iuh.modules.auth.services.impl;


import fit.iuh.models.Attachment;
import fit.iuh.models.AttachmentTargetType;
import fit.iuh.models.Comment;
import fit.iuh.models.Post;
import fit.iuh.modules.auth.dtos.interaction.CommentRequest;
import fit.iuh.modules.auth.repositories.AttachmentRepository;
import fit.iuh.modules.auth.repositories.CommentRepository;
import fit.iuh.modules.auth.repositories.PostRepository;
import fit.iuh.modules.auth.services.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final AttachmentRepository attachmentRepository; // Thêm repo xử lý file

    // TÍCH HỢP S3 CLIENT
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
                    String fileExtension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
                    String key = "comments/" + comment.getId() + "/" + UUID.randomUUID() + fileExtension;

                    s3Client.putObject(PutObjectRequest.builder()
                                    .bucket(bucketName)
                                    .key(key)
                                    .contentType(file.getContentType())
                                    .build(),
                            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                    String realUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);

                    Attachment attachment = Attachment.builder()
                            .fileName(file.getOriginalFilename())
                            .fileType(file.getContentType())
                            .size(file.getSize())
                            .fileUrl(realUrl)
                            .targetId(comment.getId())
                            .targetType(AttachmentTargetType.COMMENT) // Đánh dấu đây là file của Comment
                            .build();
                    attachmentRepository.save(attachment);

                } catch (IOException e) {
                    throw new RuntimeException("Lỗi upload file comment lên S3: " + e.getMessage());
                }
            }
        }

        return comment;
    }

    @Override
    public List<Comment> getCommentsByPost(String postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);

        // CHỖ QUAN TRỌNG: Ghép file vào từng Comment để trả về cho Frontend
        for (Comment comment : comments) {
            List<Attachment> files = attachmentRepository.findByTargetIdAndTargetType(
                    comment.getId(),
                    AttachmentTargetType.COMMENT
            );
            comment.setAttachments(files);
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
        return commentRepository.save(comment);
    }
}