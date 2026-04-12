package scoring_feedback.repositories;

import scoring_feedback.entities.GradeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeLogRepository extends JpaRepository<GradeLog, Long> {

    /**
     * Tìm tất cả logs của một grade
     */
    List<GradeLog> findByGradeId(Long gradeId);
}
