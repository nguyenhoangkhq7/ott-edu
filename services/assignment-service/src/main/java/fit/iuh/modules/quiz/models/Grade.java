package fit.iuh.modules.quiz.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Grade entity - theo đúng Class Diagram
 * gradedBy: Long (external ref tới Account trong core-service)
 * revision: Integer = 1
 */
@Entity
@Table(name = "grades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(nullable = false)
    private Integer revision = 1;

    @Column(name = "graded_by")
    private Long gradedBy;

    @OneToOne
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonBackReference
    private Submission submission;
}
