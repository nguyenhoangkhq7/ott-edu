package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    /**
     * Tìm assignments mà teamId nằm trong danh sách teamIds của assignment
     */
    @Query("SELECT DISTINCT a FROM Assignment a JOIN a.teamIds t WHERE t = :teamId")
    List<Assignment> findByTeamId(@Param("teamId") Long teamId);
}
