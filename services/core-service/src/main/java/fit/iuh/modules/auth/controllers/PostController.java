package fit.iuh.modules.auth.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import fit.iuh.models.Post;
import fit.iuh.modules.auth.dtos.post.PostRequest;
import fit.iuh.modules.auth.services.PostService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * ✅ OPTIMIZED PostController: Handles both Mobile (FormData) and Web (JSON)
 * requests
 *
 * Key Improvements: 1. Flexible @RequestPart handling 2. Fallback parsing logic
 * 3. Detailed error messages for debugging 4. Support for both Android/iOS and
 * Web clients
 */
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    static {
        MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * ✅ Enhanced createPost that handles both Mobile FormData and Web JSON
     *
     * BEFORE (problematic): - Only accepted exact @RequestPart("post") string -
     * If Mobile sent broken FormData → 500 error
     *
     * AFTER (flexible): - Try standard FormData parsing first - Fallback to
     * direct form parameter parsing - Extract postData from multiple possible
     * locations
     */
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createPost(
            @RequestPart(value = "post", required = false) String postString,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication,
            HttpServletRequest request) {

        try {
            // Get author email
            String authorEmail = authentication != null ? authentication.getName() : "anonymous";

            System.out.println("\n🔹 [PostController] Processing createPost request");
            System.out.println("   Author: " + authorEmail);

            // 🔑 STEP 1: Extract postData with fallback logic
            String postData = extractPostData(postString, request);

            if (postData == null || postData.trim().isEmpty()) {
                System.err.println("❌ [PostController] postData is null or empty");
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Missing 'post' parameter",
                        "hint", "Ensure FormData has part named 'post' with JSON content"
                ));
            }

            System.out.println("✅ [PostController] postData extracted successfully");
            System.out.println("   Length: " + postData.length() + " chars");

            // 🔑 STEP 2: Parse JSON with validation
            PostRequest postRequest = parsePostRequest(postData);

            if (postRequest == null) {
                System.err.println("❌ [PostController] Failed to parse PostRequest");
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid JSON in 'post' parameter",
                        "sample", "{\"classId\": \"...\", \"content\": \"...\", \"type\": \"DISCUSSION\"}"
                ));
            }

            System.out.println("✅ [PostController] PostRequest parsed successfully");
            System.out.println("   ClassId: " + postRequest.getClassId());
            System.out.println("   Type: " + postRequest.getType());

            // 🔑 STEP 3: Create post
            Post post = postService.createPost(postRequest, files, authorEmail);

            System.out.println("✅ [PostController] Post created successfully");
            System.out.println("   PostId: " + post.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(post);

        } catch (JsonParsingException e) {
            System.err.println("❌ [PostController] JSON parsing error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid JSON format",
                    "details", e.getMessage()
            ));

        } catch (Exception e) {
            System.err.println("❌ [PostController] Unexpected error:");
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Server error occurred",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 🔍 Extract postData with FALLBACK logic Tries multiple strategies to get
     * the JSON string
     */
    private String extractPostData(String postString, HttpServletRequest request) {
        System.out.println("\n🔍 [extractPostData] Attempting to extract postData...");

        // Strategy 1: Direct @RequestPart parameter (standard case - Web + correct Mobile)
        if (postString != null && !postString.trim().isEmpty()) {
            System.out.println("   ✅ Strategy 1: Using @RequestPart('post') directly");
            System.out.println("      Content: " + postString.substring(0, Math.min(100, postString.length())));
            return postString;
        }

        System.out.println("   ⚠️  Strategy 1 failed (postString is null/empty)");

        // Strategy 2: Extract from MultipartHttpServletRequest parameter map
        if (request instanceof MultipartHttpServletRequest) {
            MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;

            // Try to get "post" as regular form parameter (broken Mobile case)
            String postParam = multipartRequest.getParameter("post");
            if (postParam != null && !postParam.trim().isEmpty()) {
                System.out.println("   ✅ Strategy 2: Found 'post' in parameter map");
                System.out.println("      Content: " + postParam.substring(0, Math.min(100, postParam.length())));
                return postParam;
            }

            System.out.println("   ⚠️  Strategy 2 failed (no 'post' parameter)");

            // Strategy 3: Try to extract from request body (edge case)
            try {
                String bodyContent = multipartRequest.getReader()
                        .lines()
                        .reduce("", (acc, line) -> acc + line);

                if (!bodyContent.isEmpty()) {
                    System.out.println("   ✅ Strategy 3: Extracted from request body");
                    return bodyContent;
                }
            } catch (Exception e) {
                System.out.println("   ⚠️  Strategy 3 failed: " + e.getMessage());
            }
        }

        System.out.println("   ❌ All strategies failed to extract postData!");
        return null;
    }

    /**
     * 🔍 Parse JSON string to PostRequest with detailed validation
     */
    private PostRequest parsePostRequest(String jsonString) throws JsonParsingException {
        try {
            System.out.println("\n🔍 [parsePostRequest] Parsing JSON string...");

            // Try to parse as JSON
            JsonNode node = MAPPER.readTree(jsonString);

            if (!node.isObject()) {
                throw new JsonParsingException("Expected JSON object, got: " + node.getNodeType());
            }

            // Extract and validate required fields
            String classId = node.get("classId") != null ? node.get("classId").asText() : null;

            // FIX: Đổi giá trị mặc định của content từ null thành chuỗi rỗng "" để tránh lỗi null
            String content = node.get("content") != null ? node.get("content").asText() : "";

            String type = node.get("type") != null ? node.get("type").asText() : "DISCUSSION";

            if (classId == null || classId.trim().isEmpty()) {
                throw new JsonParsingException("Missing required field: 'classId'");
            }

            // FIX: Đã comment lại đoạn kiểm tra bắt buộc phải nhập chữ
            // if (content == null || content.trim().isEmpty()) {
            //     throw new JsonParsingException("Missing required field: 'content'");
            // }
            // Create request object
            PostRequest request = new PostRequest();
            request.setClassId(classId);
            request.setContent(content);

            // Validate and set type (with default fallback)
            try {
                request.setType(fit.iuh.models.PostType.valueOf(type.toUpperCase()));
            } catch (IllegalArgumentException e) {
                System.out.println("   ⚠️  Invalid type: " + type + ", using default DISCUSSION");
                request.setType(fit.iuh.models.PostType.DISCUSSION);
            }

            System.out.println("   ✅ PostRequest parsed successfully");
            return request;

        } catch (JsonParsingException e) {
            throw e;
        } catch (Exception e) {
            throw new JsonParsingException("JSON parsing failed: " + e.getMessage(), e);
        }
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Post>> getNewsfeed(@PathVariable String classId) {
        return ResponseEntity.ok(postService.getNewsfeed(classId));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable String postId, Authentication authentication) {
        String authorEmail = authentication.getName();
        postService.deletePost(postId, authorEmail);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable String postId,
            @RequestBody java.util.Map<String, String> body, // Dùng đích danh java.util.Map cho chắc cốp!
            Authentication authentication) {
        try {
            // 1. Lấy thông tin người đang đăng nhập
            String authorEmail = authentication.getName();

            // 2. Lấy nội dung mới từ Frontend gửi lên
            String newContent = body.get("content");

            // Kiểm tra an toàn
            if (newContent == null || newContent.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Nội dung bài viết không được để trống"));
            }

            // 3. Gọi service để cập nhật
            Post updatedPost = postService.updatePost(postId, newContent, authorEmail);

            return ResponseEntity.ok(updatedPost);

        } catch (Exception e) {
            // Nếu có lỗi, in ra log backend để dễ debug
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "error", "Không thể cập nhật bài viết",
                    "details", e.getMessage()
            ));
        }
    }

    /**
     * Custom exception for JSON parsing errors
     */
    private static class JsonParsingException extends Exception {

        public JsonParsingException(String message) {
            super(message);
        }

        public JsonParsingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
