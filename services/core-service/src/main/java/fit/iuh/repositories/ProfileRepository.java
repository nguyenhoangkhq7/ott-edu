package fit.iuh.repositories;

import fit.iuh.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    List<Profile> findByAccount_EmailIn(List<String> emails);

}