package fit.iuh.models;

<<<<<<< HEAD
import jakarta.persistence.*;
import lombok.*;
=======
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
>>>>>>> origin/develop

import java.time.LocalDateTime;

@Entity
<<<<<<< HEAD
@Table(
    name = "team_members",
    uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "account_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamMember {

=======
@Table(name = "team_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
>>>>>>> origin/develop
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
    // Nhiều thành viên thuộc về 1 Lớp
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    // Nhiều thành viên tương ứng với 1 Account
=======
    @Builder.Default
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamMemberRole role;

>>>>>>> origin/develop
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

<<<<<<< HEAD
    // Vai trò trong lớp: TEACHER | STUDENT
    @Column(name = "member_role", nullable = false, length = 50)
    private String memberRole;

    @Builder.Default
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();
=======
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
>>>>>>> origin/develop
}
