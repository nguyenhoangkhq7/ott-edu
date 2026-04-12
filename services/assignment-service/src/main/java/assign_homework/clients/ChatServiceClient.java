package assign_homework.clients;

import assign_homework.dto.ChatNotificationDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * FeignClient để gọi chat-service (Node.js microservice)
 * Gửi thông báo tới nhóm chat khi có sự kiện trong assignment-service
 */
@FeignClient(name = "chat-service", url = "${chat.service.url:http://localhost:3000}", fallback = ChatServiceClientFallback.class)
public interface ChatServiceClient {

    /**
     * Gửi thông báo (notify) tới nhóm chat
     *
     * @param notification DTO chứa thông tin thông báo
     * @return response từ chat-service
     */
    @PostMapping("/api/notifications/send")
    ResponseEntity<String> sendNotification(@RequestBody ChatNotificationDTO notification);
}
