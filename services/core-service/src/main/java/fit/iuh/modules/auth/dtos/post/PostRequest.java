package fit.iuh.modules.auth.dtos.post;

import fit.iuh.models.PostType;
import lombok.Data;

@Data
public class PostRequest {
    private String classId;
    private String content;
    private PostType type;
}