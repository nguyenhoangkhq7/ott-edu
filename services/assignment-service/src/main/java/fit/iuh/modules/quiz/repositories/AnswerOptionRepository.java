package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.AnswerOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AnswerOption entity
 * 
 * Manages answer options for questions.
 */
@Repository
public interface AnswerOptionRepository extends JpaRepository<AnswerOption, Long> {

    /**
     * Find all answer options for a specific question.
     */
    List<AnswerOption> findByQuestionId(Long questionId);
}
