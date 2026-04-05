package fit.iuh.modules.team.repositories;

import fit.iuh.models.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByJoinCode(String joinCode);

    boolean existsByJoinCode(String joinCode);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM Team t JOIN t.members m WHERE m.account.id = :accountId AND t.deletedAt IS NULL")
    java.util.List<Team> findAllByMemberAccountId(@org.springframework.data.repository.query.Param("accountId") Long accountId);
}
