package fit.iuh.dtos.interaction;

import lombok.Data;

@Data
public class CommentRequest {
    private String postId;
    private String content;
    private String replyToCommentId;
}