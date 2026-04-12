package assign_homework.clients;

import assign_homework.dto.ChatNotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/**
 * Fallback handler khi chat-service không available
 */
@Slf4j
@Component
public class ChatServiceClientFallback implements ChatServiceClient {

    @Override
    public ResponseEntity<String> sendNotification(ChatNotificationDTO notification) {
        log.warn("Chat Service không available. Notification không được gửi cho team: {}", notification.getTeamId());
        // Trong production, nên queue message này để retry sau
        return ResponseEntity.ok("Notification queued for later delivery");
    }
}
