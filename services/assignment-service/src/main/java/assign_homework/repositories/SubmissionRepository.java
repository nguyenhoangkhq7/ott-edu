package assign_homework.repositories;

import assign_homework.entities.Submission;
import assign_homework.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    /**
     * Tìm bài nộp theo assignment và student
     */
    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    /**
     * Lấy tất cả submissions của một assignment
     */
    List<Submission> findByAssignmentId(Long assignmentId);

    /**
     * Lấy tất cả submissions trong một team cho một assignment
     */
    List<Submission> findByAssignmentIdAndTeamId(Long assignmentId, Long teamId);

    /**
     * Đếm submissions với status cụ thể
     */
    long countByAssignmentIdAndStatus(Long assignmentId, SubmissionStatus status);

    /**
     * Kiểm tra xem submission đã tồn tại chưa
     */
    boolean existsByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    /**
     * Tạo submissions rỗng cho tất cả sinh viên trong một team
     */
    @Modifying
    @Transactional
    @Query("INSERT INTO Submission (assignmentId, studentId, teamId, status, createdAt, updatedAt) " +
            "SELECT :assignmentId, s.id, :teamId, 'NOT_SUBMITTED', NOW(), NOW() " +
            "FROM #{#entityName} s WHERE s.teamId = :teamId")
    void createSubmissionsForTeam(@Param("assignmentId") Long assignmentId, @Param("teamId") Long teamId);
}
