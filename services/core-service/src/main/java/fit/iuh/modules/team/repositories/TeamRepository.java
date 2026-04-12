package fit.iuh.modules.team.repositories;

import fit.iuh.models.Team;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    @EntityGraph(attributePaths = {"department", "members.account"})
    List<Team> findAll();

    @EntityGraph(attributePaths = {"department", "members.account"})
    Optional<Team> findById(Long id);

    @EntityGraph(attributePaths = {"department", "members.account"})
    Optional<Team> findByJoinCode(String joinCode);

    @EntityGraph(attributePaths = {"department", "members.account"})
    List<Team> findByDepartmentId(Long departmentId);
}
