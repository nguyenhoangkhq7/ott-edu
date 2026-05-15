package fit.iuh.modules.auth.services;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import lombok.extern.slf4j.Slf4j;

/**
 * SocketEventService: Service để phát sự kiện realtime tới Chat Service Chat
 * Service sẽ broadcast những sự kiện này tới các clients trong cùng room
 * (classId/teamId)
 */
@Service
@Slf4j
public class SocketEventService {

    private final RestClient restClient;
    private final String chatServiceUrl;

    public SocketEventService(@Value("${chat.service.url:http://chat-service:3001}") String chatServiceUrl) {
        this.chatServiceUrl = chatServiceUrl;
        // ✨ Ép RestClient dùng HTTP/1.1 để tương thích hoàn toàn với Node.js
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    /**
     * Phát sự kiện socket tới Chat Service
     *
     * @param eventName Tên sự kiện (e.g., "post_created", "comment_updated",
     * etc.)
     * @param classId ClassId/TeamId để route tới đúng room
     * @param payload Dữ liệu sự kiện
     */
    public void emitEvent(String eventName, String classId, Map<String, Object> payload) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("eventName", eventName);
            request.put("classId", classId);
            request.put("payload", payload);

            restClient.post()
                    .uri(chatServiceUrl + "/api/socket-events/emit")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();

            log.debug("✓ Socket event emitted: {} (classId: {})", eventName, classId);
        } catch (RestClientException e) {
            log.error("✗ Failed to emit socket event: {} - {}", eventName, e.getMessage());
            // Không throw exception để không làm gián đoạn flow chính
        }
    }

    // ========== POST EVENTS ==========
    public void emitPostCreated(String classId, Map<String, Object> postData) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "created");
        payload.put("post", postData);
        emitEvent("post_updated", classId, payload);
    }

    public void emitPostUpdated(String classId, String postId, Map<String, Object> postData) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "updated");
        payload.put("postId", postId);
        payload.put("post", postData);
        emitEvent("post_updated", classId, payload);
    }

    public void emitPostDeleted(String classId, String postId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "deleted");
        payload.put("postId", postId);
        emitEvent("post_updated", classId, payload);
    }

    // ========== COMMENT EVENTS ==========
    public void emitCommentCreated(String classId, String postId, Map<String, Object> commentData) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "created");
        payload.put("postId", postId);
        payload.put("comment", commentData);
        emitEvent("comment_updated", classId, payload);
    }

    public void emitCommentUpdated(String classId, String postId, String commentId, Map<String, Object> commentData) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "updated");
        payload.put("postId", postId);
        payload.put("commentId", commentId);
        payload.put("comment", commentData);
        emitEvent("comment_updated", classId, payload);
    }

    public void emitCommentDeleted(String classId, String postId, String commentId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "deleted");
        payload.put("postId", postId);
        payload.put("commentId", commentId);
        emitEvent("comment_updated", classId, payload);
    }

    // ========== REACTION EVENTS ==========
    public void emitReactionUpdated(String classId, String targetId, String reactionType, boolean isAdded) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", isAdded ? "added" : "removed");
        payload.put("targetId", targetId);
        payload.put("reactionType", reactionType);
        emitEvent("reaction_updated", classId, payload);
    }

    // ========== FILE EVENTS ==========
    public void emitFileUploaded(String classId, Map<String, Object> fileData) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "uploaded");
        payload.put("file", fileData);
        emitEvent("file_updated", classId, payload);
    }

    public void emitFileDeleted(String classId, String fileId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "deleted");
        payload.put("fileId", fileId);
        emitEvent("file_updated", classId, payload);
    }
}
