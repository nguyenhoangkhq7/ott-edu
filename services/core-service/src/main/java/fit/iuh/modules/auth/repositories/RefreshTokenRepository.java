package fit.iuh.modules.auth.repositories;

import fit.iuh.models.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenValueAndRevokedFalse(String tokenValue);

    List<RefreshToken> findAllByAccountIdAndRevokedFalse(Long accountId);
}
