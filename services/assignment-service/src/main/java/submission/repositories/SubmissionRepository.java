package submission.repositories;

import submission.entities.Submission;
import assign_homework.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * Repository: SubmissionRepository
 * Quản lý các operation với entity Submission
 */
@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    /**
     * Tìm Submission theo assignmentId và studentId
     * (Constraint: UNIQUE(assignment_id, student_id))
     */
    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    /**
     * Tìm tất cả Submission của một sinh viên
     */
    List<Submission> findByStudentId(Long studentId);

    /**
     * Tìm tất cả Submission của một Assignment
     */
    List<Submission> findByAssignmentId(Long assignmentId);

    /**
     * Tìm Submission theo status
     */
    @Query("SELECT s FROM Submission s WHERE s.status = :status")
    List<Submission> findByStatus(@Param("status") SubmissionStatus status);

    /**
     * Tìm Submission của sinh viên cho một Assignment cụ thể
     */
    @Query("SELECT s FROM Submission s WHERE s.assignment.id = :assignmentId AND s.studentId = :studentId")
    Optional<Submission> findSubmissionByAssignmentAndStudent(
            @Param("assignmentId") Long assignmentId,
            @Param("studentId") Long studentId);
}
