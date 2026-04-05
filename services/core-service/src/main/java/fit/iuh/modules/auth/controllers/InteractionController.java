package fit.iuh.modules.auth.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import fit.iuh.models.Comment;
import fit.iuh.models.ReactionType;
import fit.iuh.models.TargetType;
import fit.iuh.modules.auth.dtos.interaction.CommentRequest;
import fit.iuh.modules.auth.services.CommentService;
import fit.iuh.modules.auth.services.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/interact")
@RequiredArgsConstructor
public class InteractionController {

    private final CommentService commentService;
    private final ReactionService reactionService;

    // ----- API BÌNH LUẬN (ĐÃ NÂNG CẤP NHẬN FORMDATA) -----

    @PostMapping(value = "/comments", consumes = {"multipart/form-data"})
    public ResponseEntity<Comment> addComment(
            @RequestPart("comment") String commentJson,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) throws Exception {

        String authorEmail = authentication.getName();

        // Tự động ép kiểu chuỗi JSON thành Object CommentRequest
        ObjectMapper objectMapper = new ObjectMapper();
        CommentRequest request = objectMapper.readValue(commentJson, CommentRequest.class);

        // Truyền thêm files vào Service
        Comment savedComment = commentService.addComment(request, files, authorEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedComment);
    }

    @GetMapping("/comments/post/{postId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String postId) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable String commentId, Authentication authentication) {
        String authorEmail = authentication.getName();
        commentService.deleteComment(commentId, authorEmail);
        return ResponseEntity.noContent().build();
    }

    // ----- API CẢM XÚC -----

    @PostMapping("/reactions")
    public ResponseEntity<Void> toggleReaction(
            @RequestParam String targetId,
            @RequestParam TargetType targetType,
            @RequestParam ReactionType reactionType,
            Authentication authentication) {

        String authorEmail = authentication.getName();
        reactionService.toggleReaction(targetId, targetType, reactionType, authorEmail);

        return ResponseEntity.ok().build();
    }
    // ----- API SỬA BÌNH LUẬN -----
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<Comment> updateComment(
            @PathVariable String commentId,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication) {

        String authorEmail = authentication.getName();
        String newContent = body.get("content"); // Frontend gửi lên { "content": "nội dung mới" }

        Comment updatedComment = commentService.updateComment(commentId, newContent, authorEmail);
        return ResponseEntity.ok(updatedComment);
    }
}