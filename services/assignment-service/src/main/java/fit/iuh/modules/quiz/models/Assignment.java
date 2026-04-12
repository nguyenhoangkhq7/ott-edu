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
 */
@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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

    @Column(name = "creator_id")
    private Long creatorId;

    // teamIds: List<Long> - per class diagram (an assignment can be for multiple teams)
    @ElementCollection
    @CollectionTable(name = "assignment_teams", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "team_id")
    private List<Long> teamIds;

    @Column(name = "department_id")
    private Long departmentId;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions;
}
