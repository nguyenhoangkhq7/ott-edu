package fit.iuh.config.security;

import jakarta.persistence.*;
import lombok.*;

/**
 * Local read-only projection of the accounts table within ott_assignment_db.
 *
 * This is NOT a copy of the core-service Account entity. It is a minimal
 * local record seeded by Flyway migration V5 that mirrors the essential fields
 * needed for JWT token validation (email, password_hash, role, status).
 *
 * The assignment-service NEVER writes to this table directly; the core-service
 * owns account lifecycle. In production you would replace the DB lookup here
 * with a JWT-only validation (stateless) so this table is not required at all.
 */
@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocalAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private LocalAccountStatus status = LocalAccountStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private LocalRole role;

    @Column(name = "is_email_verified")
    private boolean isEmailVerified;

    @Builder.Default
    @Column(name = "is_online", nullable = false)
    private boolean isOnline = false;
}
