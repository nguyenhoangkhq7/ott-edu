package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Question entity
 * 
 * Manages questions within assignments.
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /**
     * Find all questions for an assignment.
     */
    List<Question> findByAssignmentId(Long assignmentId);
}
