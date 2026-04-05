package fit.iuh.modules.auth.services;


import fit.iuh.models.Post;
import fit.iuh.modules.auth.dtos.post.PostRequest;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface PostService {
    Post createPost(PostRequest request, List<MultipartFile> files, String authorEmail);
    List<Post> getNewsfeed(String classId);
    Post updatePost(String postId, String newContent, String authorEmail);
    void deletePost(String postId, String authorEmail);
}
