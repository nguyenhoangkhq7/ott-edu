package fit.iuh.modules.quiz.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
@Slf4j
public class SocketEventService {

    private final RestClient restClient;
    private final String chatServiceUrl;

    public SocketEventService(@Value("${chat.service.url:http://chat-service:3001}") String chatServiceUrl) {
        this.chatServiceUrl = chatServiceUrl;
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

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

            log.info("✓ Socket event emitted: {} (classId: {})", eventName, classId);
        } catch (RestClientException e) {
            log.error("✗ Failed to emit socket event: {} - {}", eventName, e.getMessage());
        }
    }

    public void emitAssignmentUpdated(Long assignmentId, List<Long> teamIds) {
        if (teamIds == null || teamIds.isEmpty()) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("assignmentId", assignmentId);
        payload.put("action", "updated");

        for (Long teamId : teamIds) {
            emitEvent("assignment_updated", String.valueOf(teamId), payload);
        }
    }
}
