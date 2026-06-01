package fit.iuh.config.security.repositories;

import fit.iuh.config.security.LocalAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository for LocalAccount — the read-only accounts projection in
 * ott_assignment_db. Used exclusively by JWT token validation logic.
 */
public interface AccountRepository extends JpaRepository<LocalAccount, Long> {
    boolean existsByEmail(String email);

    Optional<LocalAccount> findByEmail(String email);
}
