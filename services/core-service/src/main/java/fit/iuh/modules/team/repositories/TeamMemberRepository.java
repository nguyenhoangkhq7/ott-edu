package fit.iuh.modules.team.repositories;

import fit.iuh.models.TeamMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    @EntityGraph(attributePaths = {"account"})
    List<TeamMember> findAllByTeamId(Long teamId);

    Optional<TeamMember> findByTeamIdAndAccountId(Long teamId, Long accountId);

    @EntityGraph(attributePaths = {"account", "team"})
    List<TeamMember> findByAccountId(Long accountId);
}
