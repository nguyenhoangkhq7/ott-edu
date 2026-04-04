package fit.iuh.controllers;

import fit.iuh.dtos.post.PostRequest;
import fit.iuh.models.Post;
import fit.iuh.services.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Post> createPost(
            @RequestPart("post") PostRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {

        // authentication.getName() sẽ trả về email/username từ chuỗi JWT
        String authorEmail = authentication.getName();

        Post post = postService.createPost(request, files, authorEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Post>> getNewsfeed(@PathVariable String classId) {
        return ResponseEntity.ok(postService.getNewsfeed(classId));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable String postId, Authentication authentication) {
        String authorEmail = authentication.getName(); // Lấy email từ Token
        postService.deletePost(postId, authorEmail);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{postId}")
    public ResponseEntity<Post> updatePost(
            @PathVariable String postId,
            @RequestBody java.util.Map<String, String> body, // 1. Yêu cầu Backend nhận cục JSON
            Authentication authentication) {

        String authorEmail = authentication.getName();
        String newContent = body.get("content"); // 2. "Mở hộp" lấy đúng đoạn text bên trong

        Post updatedPost = postService.updatePost(postId, newContent, authorEmail);
        return ResponseEntity.ok(updatedPost);
    }
}