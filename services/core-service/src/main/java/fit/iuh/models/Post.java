package fit.iuh.models;


import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;
import java.util.Date;
import java.util.List;

@Document(collection = "posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Post {
    @Id
    private String id;
    private String classId;
    private String authorId;
    private String content;
    private PostType type;

    @Builder.Default private Boolean isPinned = false;
    @Builder.Default private Integer commentCount = 0;
    @Builder.Default private Integer reactionCount = 0;

    @CreatedDate private Date createdAt;
    @LastModifiedDate private Date updatedAt;

    @Transient // Không lưu trường này vào DB, chỉ dùng để trả về JSON
    private List<Attachment> attachments;

    @Transient
    private String authorName;

    @Transient
    private String authorAvatar;
}