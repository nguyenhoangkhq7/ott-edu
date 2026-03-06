package fit.iuh.repositories;

import fit.iuh.models.Account;
import fit.iuh.models.Profile;
import fit.iuh.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    boolean existsByEmail(String email);
}



