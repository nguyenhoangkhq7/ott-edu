package fit.iuh.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "schools")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class School {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // Quan hệ 1-Nhiều: Một trường có nhiều Khoa
    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Department> departments;
}