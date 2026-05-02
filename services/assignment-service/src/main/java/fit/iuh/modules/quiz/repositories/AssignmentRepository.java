package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.Assignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Assignment entity
 * 
 * Supports both traditional queries and paginated results for efficient list
 * operations.
 */
@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    /**
     * Find all assignments assigned to a specific team (with pagination).
     * Used by STUDENT to view their team's assignments.
     */
    @Query("SELECT DISTINCT a FROM Assignment a JOIN a.teamIds t WHERE t = :teamId")
    Page<Assignment> findByTeamId(@Param("teamId") Long teamId, Pageable pageable);

    /**
     * Find all assignments created by a specific teacher (with pagination).
     * Used by TEACHER to view their own assignments.
     */
    Page<Assignment> findByCreatorId(Long creatorId, Pageable pageable);

    /**
     * Find all assignments created by a teacher assigned to specific teams (with
     * pagination).
     * Used to validate teacher's ownership before grading.
     */
    @Query("SELECT DISTINCT a FROM Assignment a WHERE a.creatorId = :creatorId AND a.id = :assignmentId")
    Optional<Assignment> findByIdAndCreatorId(@Param("assignmentId") Long assignmentId,
            @Param("creatorId") Long creatorId);

    /**
     * Find all assignments (non-archived) assigned to a specific team.
     * Used by STUDENT to fetch active assignments.
     */
    @Query("SELECT DISTINCT a FROM Assignment a JOIN a.teamIds t WHERE t = :teamId AND a.archivedAt IS NULL")
    List<Assignment> findActiveByTeamId(@Param("teamId") Long teamId);
}
