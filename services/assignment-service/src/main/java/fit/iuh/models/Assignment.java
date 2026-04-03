package fit.iuh.models;

import fit.iuh.models.enums.AssignmentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "asgn_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String instructions;

    private Double maxScore;

    private LocalDateTime dueDate;

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private AssignmentType type;

    // Reference ID for the cross-service link to Team (in core-service)
    private Long teamId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
