package fit.iuh.models;

<<<<<<< HEAD
import jakarta.persistence.*;
import lombok.*;
=======
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
>>>>>>> origin/develop

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
<<<<<<< HEAD
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Team {

=======
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {
>>>>>>> origin/develop
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

<<<<<<< HEAD
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "join_code", nullable = false, unique = true, length = 20)
=======
    private String description;

    @Column(name = "join_code", nullable = false, unique = true)
>>>>>>> origin/develop
    private String joinCode;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

<<<<<<< HEAD
    // Nhiều lớp thuộc về 1 Trường
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    // Nhiều lớp thuộc về 1 Khoa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    // 1 Lớp có nhiều thành viên
    @Builder.Default
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
=======
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
>>>>>>> origin/develop
    private List<TeamMember> members = new ArrayList<>();
}
