package fit.iuh.services;
import fit.iuh.dtos.post.PostRequest;
import fit.iuh.models.Post;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface PostService {
    Post createPost(PostRequest request, List<MultipartFile> files, String authorEmail);
    List<Post> getNewsfeed(String classId);
    Post updatePost(String postId, String newContent, String authorEmail);
    void deletePost(String postId, String authorEmail);
}