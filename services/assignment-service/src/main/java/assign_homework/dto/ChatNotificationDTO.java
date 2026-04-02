package assign_homework.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để gửi thông báo sang chat-service (Node.js)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotificationDTO {

    /**
     * ID của team/nhóm chat
     */
    private Long teamId;

    /**
     * Nội dung tin nhắn
     */
    private String message;

    /**
     * Kiểu thông báo: ASSIGNMENT_PUBLISHED, ASSIGNMENT_DEADLINE, etc.
     */
    private String notificationType;

    /**
     * ID của assignment (nếu liên quan)
     */
    private Long assignmentId;

    /**
     * Tên giáo viên gửi thông báo
     */
    private String senderName;
}
