package fit.iuh.repositories;

import fit.iuh.models.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findAllByTeamId(Long teamId);

    boolean existsByTeamIdAndAccountId(Long teamId, Long accountId);

    Optional<TeamMember> findByTeamIdAndAccountId(Long teamId, Long accountId);
}
