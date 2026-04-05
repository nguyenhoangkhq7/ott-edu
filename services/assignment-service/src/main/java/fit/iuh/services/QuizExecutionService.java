package fit.iuh.services;

import fit.iuh.dtos.SubmissionResultResponse;
import fit.iuh.dtos.SubmitQuizRequest;
import fit.iuh.exceptions.AppException;
import fit.iuh.models.*;
import fit.iuh.models.enums.QuestionType;
import fit.iuh.models.enums.SubmissionStatus;
import fit.iuh.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizExecutionService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;
    private final SubmissionRepository submissionRepository;
    private final StudentAnswerRepository studentAnswerRepository;

    @Transactional
    public SubmissionResultResponse submitQuiz(SubmitQuizRequest request) {
        log.info("Processing quiz submission for assignment: {} by account: {}", request.getAssignmentId(), request.getAccountId());

        // 1. Fetch & Validate Assignment
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));

        // Optional: Check if already submitted
        List<Submission> existing = submissionRepository.findByAssignmentIdAndAccountId(assignment.getId(), request.getAccountId());
        if (!existing.isEmpty()) {
            throw new AppException("You have already submitted this assignment.", HttpStatus.BAD_REQUEST);
        }

        // 2. Create Submission Record
        Long teamMemberId = request.getTeamMemberId() != null ? request.getTeamMemberId() : request.getAccountId();
        log.debug("Using teamMemberId: {} for submission", teamMemberId);

        Submission submission = Submission.builder()
                .assignment(assignment)
                .accountId(request.getAccountId())
                .teamMemberId(teamMemberId)
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .late(assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate()))
                .build();

        Submission savedSubmission = submissionRepository.save(submission);

        // 3. Process each answer and compute score
        double totalScore = 0.0;
        try {
            for (SubmitQuizRequest.StudentAnswerDTO answerDTO : request.getAnswers()) {
                totalScore += processAndGradeAnswer(savedSubmission, answerDTO);
            }
        } catch (Exception e) {
            log.error("Error processing quiz answers", e);
            throw e;
        }

        // 4. Update final submission score
        savedSubmission.setScore(totalScore);
        submissionRepository.save(savedSubmission);

        log.info("Quiz submitted successfully. Final Score: {}/{}", totalScore, assignment.getMaxScore());

        return SubmissionResultResponse.builder()
                .id(savedSubmission.getId())
                .assignmentId(assignment.getId())
                .score(totalScore)
                .maxScore(assignment.getMaxScore())
                .submittedAt(savedSubmission.getSubmittedAt())
                .isLate(savedSubmission.isLate())
                .build();
    }

    private double processAndGradeAnswer(Submission submission, SubmitQuizRequest.StudentAnswerDTO answerDTO) {
        Question question = questionRepository.findById(answerDTO.getQuestionId())
                .orElseThrow(() -> new AppException("Question not found: " + answerDTO.getQuestionId(), HttpStatus.NOT_FOUND));

        List<AnswerOption> selectedOptions = answerOptionRepository.findAllById(answerDTO.getSelectedOptionIds());
        
        double earnedPoints = 0.0;
        if (question.getQuestionType() != QuestionType.ESSAY) {
            earnedPoints = calculateGrade(question, selectedOptions);
        }

        StudentAnswer studentAnswer = StudentAnswer.builder()
                .submission(submission)
                .question(question)
                .earnedPoints(earnedPoints)
                .selectedOptions(selectedOptions)
                .content(answerDTO.getContent())
                .build();

        studentAnswerRepository.save(studentAnswer);
        return earnedPoints;
    }

    private double calculateGrade(Question question, List<AnswerOption> selectedOptions) {
        // Fetch all correct options for this question
        Set<Long> correctOptionIds = question.getOptions().stream()
                .filter(AnswerOption::isCorrect)
                .map(AnswerOption::getId)
                .collect(Collectors.toSet());

        Set<Long> selectedOptionIds = selectedOptions.stream()
                .map(AnswerOption::getId)
                .collect(Collectors.toSet());

        // Logic: All or Nothing for Multiple Choice
        if (!correctOptionIds.isEmpty() && correctOptionIds.equals(selectedOptionIds)) {
            return question.getPoints();
        }
        
        return 0.0;
    }
}
