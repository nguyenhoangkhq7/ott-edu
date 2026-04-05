package fit.iuh.models;

import fit.iuh.models.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private Double points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType questionType;

    @Column(name = "display_order")
    private Integer displayOrder;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AnswerOption> options = new ArrayList<>();

    @PrePersist
    protected void onPrePersist() {
        if (points == null) points = 1.0;
        if (questionType == null) questionType = QuestionType.SINGLE_CHOICE;
        if (displayOrder == null) displayOrder = 0;
    }
}
