package fit.iuh.modules.quiz.dtos;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for student to view their grade and teacher's feedback
 * 
 * Security Note:
 * - Only student who owns the submission can view this
 * - Teacher ID intentionally hidden (microservices boundary)
 * - Revision number indicates how many times grade was updated
 */
@Data
public class GradeDetailsDto {

    private Long id;
    private Double score;
    private String feedback;

    private LocalDateTime gradedAt;
    private Integer revision;
}
