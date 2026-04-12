package submission.repositories;

import submission.entities.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository: StudentAnswerRepository
 * Quản lý các operation với entity StudentAnswer
 */
@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {

    /**
     * Tìm tất cả câu trả lời của một Submission
     */
    List<StudentAnswer> findBySubmissionId(Long submissionId);

    /**
     * Tìm câu trả lời cho một câu hỏi cụ thể trong một Submission
     */
    Optional<StudentAnswer> findBySubmissionIdAndQuestionId(Long submissionId, Long questionId);

    /**
     * Tìm tất cả câu trả lời cho một câu hỏi
     */
    List<StudentAnswer> findByQuestionId(Long questionId);

    /**
     * Xóa tất cả câu trả lời của một Submission
     * (Dùng để reset submission)
     */
//    @Query("DELETE FROM StudentAnswer sa WHERE sa.submission.id = :submissionId")
    void deleteBySubmissionId(@Param("submissionId") Long submissionId);
}
