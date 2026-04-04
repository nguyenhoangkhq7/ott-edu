package fit.iuh.models;

import fit.iuh.models.enums.AttachmentTargetType;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;

@Document(collection = "attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Attachment {
    @Id
    private String id;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long size;
    private String targetId;
    private AttachmentTargetType targetType;
    private String classId;
    private String userId;

    @Transient
    private String authorName;
}