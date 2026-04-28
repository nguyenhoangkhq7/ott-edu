package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Grade entity
 * 
 * Manages grade records for submissions.
 */
@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {

    /**
     * Find the latest grade for a submission.
     * Used when viewing grades or updating grades.
     */
    Optional<Grade> findBySubmissionId(Long submissionId);

    /**
     * Find the highest revision number for a submission's grades.
     * Used to determine the next revision number when re-grading.
     */
    @Query("SELECT MAX(g.revision) FROM Grade g WHERE g.submission.id = :submissionId")
    Integer findMaxRevisionBySubmissionId(@Param("submissionId") Long submissionId);
}
