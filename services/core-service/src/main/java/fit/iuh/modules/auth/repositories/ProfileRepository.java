package fit.iuh.modules.auth.repositories;

import fit.iuh.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
}
