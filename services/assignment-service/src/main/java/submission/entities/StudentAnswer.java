package submission.entities;

import create_assignment.entities.AnswerOption;
import create_assignment.entities.Question;
import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDateTime;

/**
 * Entity: StudentAnswer
 * Mục đích: Lưu trữ câu trả lời chi tiết của sinh viên cho từng câu hỏi (Quiz)
 * 
 * Relationships:
 * - ManyToOne: Submission
 * - ManyToOne: Question
 * - ManyToOne: AnswerOption (option được chọn)
 */
@Entity(name = "SubmissionStudentAnswer")
@Table(name = "student_answers", uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_answer_question", columnNames = { "submission_id", "question_id" })
}, indexes = {
        @Index(name = "idx_student_answer_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Điểm kiếm được cho câu hỏi này
     * - Nếu chọn đáp án đúng (isCorrect=true): earnedPoints = câu hỏi có điểm bao
     * nhiêu
     * - Nếu sai: earnedPoints = 0
     */
    @Column(name = "earned_points", nullable = false)
    @Builder.Default
    private Double earnedPoints = 0.0;

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
     * ManyToOne: Mỗi StudentAnswer thuộc một Submission
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonBackReference
    private Submission submission;

    /**
     * ManyToOne: Mỗi StudentAnswer liên quan đến một Question
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonBackReference
    private Question question;

    /**
     * ManyToOne: Option được chọn bởi sinh viên
     * Có thể NULL (nếu sinh viên không chọn câu trả lời)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id", nullable = true)
    @JsonBackReference
    private AnswerOption selectedOption;

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
