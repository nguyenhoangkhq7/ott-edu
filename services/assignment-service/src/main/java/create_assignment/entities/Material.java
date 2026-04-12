package create_assignment.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(name = "type")
    private String type;

    @ManyToMany(mappedBy = "materials")
    @Builder.Default
    private List<Assignment> assignments = new ArrayList<>();
}
