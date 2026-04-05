package fit.iuh.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "earned_points")
    private Double earnedPoints;

    @ManyToMany
    @JoinTable(
        name = "student_answer_selected_options",
        joinColumns = @JoinColumn(name = "student_answer_id"),
        inverseJoinColumns = @JoinColumn(name = "answer_option_id")
    )
    @Builder.Default
    private List<AnswerOption> selectedOptions = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String content; // For essay or short answer questions

    @PrePersist
    protected void onPrePersist() {
        if (earnedPoints == null) earnedPoints = 0.0;
    }
}
