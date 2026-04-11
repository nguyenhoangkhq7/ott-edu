package create_assignment.repositories;

import create_assignment.entities.AnswerOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerOptionRepository extends JpaRepository<AnswerOption, Long> {

    /**
     * Tìm tất cả đáp án của một câu hỏi
     */
    List<AnswerOption> findByQuestionId(Long questionId);

    /**
     * Tìm đáp án đúng của một câu hỏi
     */
    AnswerOption findByQuestionIdAndIsCorrectTrue(Long questionId);
}
