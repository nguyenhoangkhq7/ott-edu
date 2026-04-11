package scoring_feedback.repositories;

import scoring_feedback.entities.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAnswerFeedbackRepository extends JpaRepository<StudentAnswer, Long> {

    /**
     * Tìm tất cả câu trả lời của sinh viên cho một submission
     */
    List<StudentAnswer> findBySubmissionId(Long submissionId);

    /**
     * Tìm tất cả câu trả lời sai của sinh viên cho một submission
     */
    List<StudentAnswer> findBySubmissionIdAndIsCorrectFalse(Long submissionId);

    /**
     * Tìm tất cả câu trả lời đúng của sinh viên cho một submission
     */
    List<StudentAnswer> findBySubmissionIdAndIsCorrectTrue(Long submissionId);

    /**
     * Đếm số câu trả lời đúng
     */
    long countBySubmissionIdAndIsCorrectTrue(Long submissionId);

    /**
     * Đếm số câu trả lời sai
     */
    long countBySubmissionIdAndIsCorrectFalse(Long submissionId);
}
