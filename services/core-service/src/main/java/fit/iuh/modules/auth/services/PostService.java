package fit.iuh.modules.auth.services;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import fit.iuh.models.Post;
import fit.iuh.modules.auth.dtos.post.PostRequest;

public interface PostService {

    Post createPost(PostRequest request, List<MultipartFile> files, String authorEmail);

    List<Post> getNewsfeed(String classId, String currentUserEmail);

    Post updatePost(String postId, String newContent, String authorEmail);

    void deletePost(String postId, String authorEmail);
}
