package fit.iuh.modules.quiz.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object representing a calendar event returned to the frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {
    private Long id;
    private String title;
    private String type; // 'ASSIGNMENT' | 'QUIZ'
    private String courseName;
    private Long teamId;
    private LocalDateTime dueDate; // Jackson appends 'Z' automatically based on JacksonConfig
}
