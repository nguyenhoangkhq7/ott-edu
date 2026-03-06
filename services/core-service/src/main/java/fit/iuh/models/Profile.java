package fit.iuh.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Profile {
    @Id
    @Column(name = "account_id")
    private Long accountId;

    @OneToOne
    @MapsId // Báo cho JPA biết dùng ID của Account làm PK cho bảng Profile
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String code; // MSSV / MSGV
    private String department;
    private String bio;
    private String phone;
}