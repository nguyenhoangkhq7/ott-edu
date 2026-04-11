package submission.entities;

import create_assignment.entities.Assignment;
import create_assignment.entities.Material;
import assign_homework.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity: Submission
 * Mục đích: Lưu trữ thông tin bài nộp của sinh viên (ESSAY hoặc QUIZ)
 * 
 * Relationships:
 * - ManyToOne: Assignment (bài tập)
 * - OneToMany: StudentAnswer (chi tiết câu trả lời cho Quiz)
 * - ManyToMany: Material (file đính kèm)
 */
@Entity
@Table(name = "submissions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_submission_student_assignment", columnNames = { "assignment_id", "student_id" })
}, indexes = {
        @Index(name = "idx_submission_status", columnList = "status"),
        @Index(name = "idx_submission_student", columnList = "student_id"),
        @Index(name = "idx_submission_submitted_at", columnList = "submitted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nội dung bài nộp (cho ESSAY)
     */
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    /**
     * Điểm số sinh viên đạt được
     * - Với Quiz: Tính tự động dựa trên correct answers
     * - Với Essay: Do giáo viên chấm điểm
     */
    private Double score;

    /**
     * Nhận xét/Feedback từ giáo viên
     */
    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    /**
     * Thời gian sinh viên nộp bài
     */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /**
     * Thời gian giáo viên chấm điểm
     */
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    /**
     * Có quá hạn nộp hay không
     */
    @Column(name = "is_late", nullable = false)
    @Builder.Default
    private Boolean isLate = false;

    /**
     * Trạng thái bài nộp: NOT_SUBMITTED, SUBMITTED, GRADED, REJECTED,
     * DEADLINE_PASSED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.NOT_SUBMITTED;

    /**
     * AccountID của sinh viên (không lưu relationship trực tiếp)
     */
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    /**
     * Team ID (lớp/nhóm) mà sinh viên thuộc về
     */
    @Column(name = "team_id", nullable = false)
    private Long teamId;

    /**
     * Thời gian tạo bản ghi
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Thời gian cập nhật lần cuối
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== RELATIONSHIPS ==========

    /**
     * ManyToOne: Mỗi Submission thuộc một Assignment
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    @JsonBackReference
    private Assignment assignment;

    /**
     * OneToMany: Một Submission có nhiều StudentAnswer (cho Quiz)
     */
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<StudentAnswer> studentAnswers = new ArrayList<>();

    /**
     * ManyToMany: Một Submission có nhiều Material (file đính kèm)
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "submission_material", joinColumns = @JoinColumn(name = "submission_id"), inverseJoinColumns = @JoinColumn(name = "material_id"))
    @JsonManagedReference
    @Builder.Default
    private List<Material> materials = new ArrayList<>();

    // ========== LIFECYCLE CALLBACKS ==========

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
