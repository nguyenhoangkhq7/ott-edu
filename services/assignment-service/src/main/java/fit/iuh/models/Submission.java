package fit.iuh.models;

import fit.iuh.models.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "team_member_id", nullable = true)
    private Long teamMemberId;

    private Double score;

    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Column(name = "is_late")
    private boolean late;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentAnswer> studentAnswers = new ArrayList<>();

    @PrePersist
    protected void onPrePersist() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
        if (status == null) status = SubmissionStatus.SUBMITTED;
        if (score == null) score = 0.0;
    }
}
