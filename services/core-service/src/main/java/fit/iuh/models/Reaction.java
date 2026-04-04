package fit.iuh.models;

import fit.iuh.models.enums.ReactionType;
import fit.iuh.models.enums.TargetType;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;
import java.util.Date;

@Document(collection = "reactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reaction {
    @Id
    private String id;
    private String targetId;
    private TargetType targetType;
    private String authorId;
    private ReactionType type;

    @CreatedDate private Date createdAt;
}