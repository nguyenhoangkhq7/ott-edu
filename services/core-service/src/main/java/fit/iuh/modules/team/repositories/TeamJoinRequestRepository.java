package fit.iuh.modules.team.repositories;

import fit.iuh.models.TeamJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamJoinRequestRepository extends JpaRepository<TeamJoinRequest, Long> {
    List<TeamJoinRequest> findByTeamIdAndStatus(Long teamId, TeamJoinRequest.JoinRequestStatus status);
    Optional<TeamJoinRequest> findByTeamIdAndAccountId(Long teamId, Long accountId);
}
