package fit.iuh.repositories;

import fit.iuh.models.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenValueAndRevokedFalse(String tokenValue);
}
