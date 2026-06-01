package fit.iuh.modules.quiz.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Assignment entity - theo đúng Class Diagram
 * AssignmentType: ESSAY | QUIZ
 * teamIds: List<Long> - lưu nhiều team, dùng @ElementCollection
 * materialUrls: List<String> - AWS S3 file links cho teacher materials
 * maxAttempts: Integer - giới hạn số lần làm bài QUIZ
 */
@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "max_score")
    private Double maxScore;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentType type;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    // teamIds: List<Long> - per class diagram (an assignment can be for multiple
    // teams)
    @ElementCollection
    @CollectionTable(name = "assignment_teams", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "team_id")
    private List<Long> teamIds;

    // NEW: materialUrls - AWS S3 links cho teacher materials (cho ESSAY
    // assignments)
    @ElementCollection
    @CollectionTable(name = "assignment_materials", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "material_url", columnDefinition = "TEXT")
    private List<String> materialUrls;

    // NEW: maxAttempts - giới hạn số lần làm bài QUIZ (null hoặc unlimited nếu
    // không set)
    @Column(name = "max_attempts")
    private Integer maxAttempts;

    // NEW: timeLimit - thời gian làm bài QUIZ tính bằng phút (null = không giới hạn)
    @Column(name = "time_limit")
    private Integer timeLimit;

    // NEW: showScoreAfterSubmit - có hiển thị điểm cho sinh viên sau khi nộp không (mặc định: true)
    @Column(name = "show_score_after_submit", nullable = false)
    private Boolean showScoreAfterSubmit = true;

    // NEW: showAnswersAfterSubmit - có cho phép sinh viên xem lại bài làm sau khi nộp không (mặc định: false)
    @Column(name = "show_answers_after_submit", nullable = false)
    private Boolean showAnswersAfterSubmit = false;

    @Column(name = "department_id")
    private Long departmentId;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions;
}
