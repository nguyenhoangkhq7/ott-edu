package fit.iuh.modules.quiz.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Submission entity - theo đúng Class Diagram
 * accountId: Long (external ref tới Account trong core-service)
 */
@Entity
@Table(name = "submissions", uniqueConstraints = @UniqueConstraint(columnNames = { "assignment_id", "account_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "is_late")
    private boolean isLate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "file_url", length = 2048)
    private String fileUrl; // For essay submissions

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Assignment assignment;

    @com.fasterxml.jackson.annotation.JsonGetter("assignmentId")
    public Long getAssignmentIdVal() {
        return assignment != null ? assignment.getId() : null;
    }

    @OneToOne(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private Grade grade;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentAnswer> studentAnswers = new ArrayList<>();

    // setLate() - method per class diagram
    public void setLate(boolean late) {
        this.isLate = late;
    }
}
