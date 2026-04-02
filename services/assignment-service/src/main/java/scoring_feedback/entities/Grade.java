package scoring_feedback.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho bản ghi chấm điểm (Grade) của một submission
 */
@Entity
@Table(name = "grades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của submission được chấm
     */
    @Column(name = "submission_id", nullable = false, unique = true)
    private Long submissionId;

    /**
     * ID của giáo viên chấm bài
     */
    @Column(name = "graded_by_teacher_id", nullable = false)
    private Long gradedByTeacherId;

    /**
     * Điểm số chấm (0 - maxScore của assignment)
     */
    @Column(nullable = false)
    private Double score;

    /**
     * Nhận xét/Feedback từ giáo viên (tùy chọn, nullable)
     */
    @Column(columnDefinition = "TEXT", nullable = true)
    private String feedback;

    /**
     * Thời gian chấm bài
     */
    @Column(name = "graded_at", nullable = false)
    private LocalDateTime gradedAt;

    /**
     * Thời gian cập nhật lần cuối (nếu giáo viên sửa điểm)
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.gradedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
