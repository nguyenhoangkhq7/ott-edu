package assign_homework.dto;

import create_assignment.enums.AssignmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO Response khi publish assignment thành công
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishAssignmentResponseDTO {

    private Long assignmentId;

    private String title;

    private LocalDateTime publishedAt;

    private Long teamId;

    private int submissionsCreated;

    private String message;
}
