package fit.iuh.models;

import fit.iuh.models.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "asgn_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Double score;

    private LocalDateTime submittedAt;

    private boolean isLate;

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    // Reference ID to core-service's TeamMember or Account
    private Long teamMemberId;

    // The user's account ID (also for reference ease)
    private Long accountId;

}
