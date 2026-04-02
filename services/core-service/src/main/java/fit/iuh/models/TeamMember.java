package fit.iuh.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "team_members",
    uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "account_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nhiều thành viên thuộc về 1 Lớp
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    // Nhiều thành viên tương ứng với 1 Account
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    // Vai trò trong lớp: TEACHER | STUDENT
    @Column(name = "member_role", nullable = false, length = 50)
    private String memberRole;

    @Builder.Default
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();
}
