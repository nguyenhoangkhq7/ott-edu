package fit.iuh.dtos.post;

import fit.iuh.models.enums.PostType;
import lombok.Data;

@Data
public class PostRequest {
    private String classId;
    private String content;
    private PostType type;
}