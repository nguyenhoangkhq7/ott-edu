package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.Submission;
import fit.iuh.modules.quiz.models.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Submission entity
 * 
 * Supports both student submission queries and teacher grading queries with
 * pagination.
 */
@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    /**
     * Find a student's submission for a specific assignment.
     * Used to resume or check submission status.
     */
    Optional<Submission> findByAccountIdAndAssignmentId(Long accountId, Long assignmentId);

    /**
     * Find all submissions for a specific assignment (with pagination).
     * Used by TEACHER to get submissions for grading with pagination support.
     */
    Page<Submission> findByAssignmentId(Long assignmentId, Pageable pageable);

    /**
     * Find submissions with pending grades for a specific assignment.
     * Used by TEACHER to identify submissions that need grading.
     */
    @Query("SELECT s FROM Submission s WHERE s.assignment.id = :assignmentId AND s.grade IS NULL ORDER BY s.submittedAt DESC")
    Page<Submission> findPendingGradesByAssignmentId(@Param("assignmentId") Long assignmentId, Pageable pageable);

    /**
     * Find all submissions by a student (with pagination).
     * Used by STUDENT to view their submission history.
     */
    Page<Submission> findByAccountId(Long accountId, Pageable pageable);

    /**
     * Find all non-graded submissions for an assignment.
     * Used for grading queue.
     */
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.assignment.id = :assignmentId AND s.grade IS NULL")
    Long countPendingGradesByAssignmentId(@Param("assignmentId") Long assignmentId);

    /**
     * Find all graded submissions for an assignment.
     * Used for dashboard metrics.
     */
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.assignment.id = :assignmentId AND s.grade IS NOT NULL")
    Long countGradedByAssignmentId(@Param("assignmentId") Long assignmentId);

    // ============== NEW: Attempt History Queries ==============

    /**
     * Get attempt history for a STUDENT on a SPECIFIC ASSIGNMENT
     * 
     * Used for displaying: Attempt #, Date-Time, Score, Status, Feedback
     * Returns submissions in reverse chronological order (newest first)
     * 
     * @param accountId    Student's account ID
     * @param assignmentId Assignment ID
     * @return List of submissions (attempts) for this assignment
     */
    @Query("SELECT s FROM Submission s " +
            "WHERE s.accountId = :accountId AND s.assignment.id = :assignmentId " +
            "ORDER BY s.submittedAt DESC")
    List<Submission> findAttemptHistoryByAccountAndAssignment(
            @Param("accountId") Long accountId,
            @Param("assignmentId") Long assignmentId);

    /**
     * Count number of SUBMITTED/GRADED attempts for a student on an assignment
     * 
     * Used to enforce maxAttempts limit for QUIZ assignments
     * 
     * @param accountId    Student's account ID
     * @param assignmentId Assignment ID
     * @return Number of completed attempts
     */
    @Query("SELECT COUNT(s) FROM Submission s " +
            "WHERE s.accountId = :accountId AND s.assignment.id = :assignmentId " +
            "AND (s.status = 'SUBMITTED' OR s.status = 'GRADED')")
    Long countCompletedAttempts(
            @Param("accountId") Long accountId,
            @Param("assignmentId") Long assignmentId);

    /**
     * Check if a student has already started the assignment (has a DRAFT
     * submission)
     * 
     * Used for resuming quiz or preventing duplicate starts
     * 
     * @param accountId    Student's account ID
     * @param assignmentId Assignment ID
     * @return Optional containing the draft submission if exists
     */
    @Query("SELECT s FROM Submission s " +
            "WHERE s.accountId = :accountId AND s.assignment.id = :assignmentId " +
            "AND s.status = 'DRAFT'")
    Optional<Submission> findDraftByAccountAndAssignment(
            @Param("accountId") Long accountId,
            @Param("assignmentId") Long assignmentId);
}
