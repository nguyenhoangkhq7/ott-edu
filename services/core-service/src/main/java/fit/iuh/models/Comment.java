package fit.iuh.models;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;
import java.util.Date;
import java.util.List;

@Document(collection = "comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Comment {
    @Id
    private String id;
    private String postId;
    private String authorId;
    private String content;
    private String replyToCommentId;

    @Builder.Default private Integer reactionCount = 0;

    @CreatedDate private Date createdAt;
    @LastModifiedDate private Date updatedAt;

    @Transient
    private List<Attachment> attachments;
}