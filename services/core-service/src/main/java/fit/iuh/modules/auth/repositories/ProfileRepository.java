package fit.iuh.modules.auth.repositories;


import fit.iuh.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    List<Profile> findByAccount_EmailIn(List<String> emails);
    Optional<Profile> findByAccount_Email(String email);
}