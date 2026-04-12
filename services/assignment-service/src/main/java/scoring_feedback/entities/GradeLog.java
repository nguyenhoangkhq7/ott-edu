package scoring_feedback.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity để log các hoạt động chấm điểm (tracking changes)
 */
@Entity
@Table(name = "grade_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của Grade được log
     */
    @Column(name = "grade_id", nullable = false)
    private Long gradeId;

    /**
     * Hành động: CREATED, UPDATED
     */
    @Column(nullable = false)
    private String action;

    /**
     * Chi tiết về thay đổi (e.g., "Score changed from 7.0 to 8.5")
     */
    @Column(columnDefinition = "TEXT")
    private String details;

    /**
     * ID của giáo viên thực hiện thay đổi
     */
    @Column(name = "changed_by_teacher_id", nullable = false)
    private Long changedByTeacherId;

    /**
     * Thời gian hành động
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
