package fit.iuh.services;
import fit.iuh.dtos.interaction.CommentRequest;
import fit.iuh.models.Comment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CommentService {
    Comment addComment(CommentRequest request, List<MultipartFile> files, String authorEmail);
    List<Comment> getCommentsByPost(String postId);
    void deleteComment(String commentId, String authorEmail);
    Comment updateComment(String commentId, String newContent, String authorEmail);
}