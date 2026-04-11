package create_assignment.repositories;

import create_assignment.entities.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /**
     * Tìm tất cả câu hỏi của một bài tập
     */
    List<Question> findByAssignmentId(Long assignmentId);
}
