package fit.iuh.modules.quiz.repositories;

import fit.iuh.modules.quiz.models.Submission;
import fit.iuh.modules.quiz.models.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByAccountIdAndAssignmentId(Long accountId, Long assignmentId);
}
