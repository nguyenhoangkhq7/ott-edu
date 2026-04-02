package scoring_feedback.repositories;

import scoring_feedback.entities.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {

    /**
     * Tìm grade theo submission ID
     */
    Optional<Grade> findBySubmissionId(Long submissionId);

    /**
     * Kiểm tra xem grade đã tồn tại cho submission này chưa
     */
    boolean existsBySubmissionId(Long submissionId);
}
