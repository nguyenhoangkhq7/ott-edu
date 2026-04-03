package fit.iuh.services;

import fit.iuh.dtos.SubmissionResultResponse;
import fit.iuh.dtos.SubmitQuizRequest;
import fit.iuh.models.*;
import fit.iuh.models.enums.SubmissionStatus;
import fit.iuh.repositories.*;
import fit.iuh.exceptions.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
        log.info("Processing quiz submission for assignment: {} by user: {}", request.getAssignmentId(), request.getAccountId());

        // 1. Fetch & Validate Assignment
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));

        validateSubmission(assignment, request.getAccountId());

        // 2. Initial Submission Record
        Submission submission = Submission.builder()
                .assignment(assignment)
                .accountId(request.getAccountId())
                .teamMemberId(request.getTeamMemberId())
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .isLate(assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate()))
                .build();

        Submission savedSubmission = submissionRepository.save(submission);

        // 3. Process Answers & Auto-Grade
        double totalScore = processAndGradeAnswers(savedSubmission, request.getAnswers());

        // 4. Update Final Score
        savedSubmission.setScore(totalScore);
        submissionRepository.save(savedSubmission);

        log.info("Submission completed. Score: {}/{}", totalScore, assignment.getMaxScore());

        return SubmissionResultResponse.builder()
                .id(savedSubmission.getId())
                .assignmentId(assignment.getId())
                .score(totalScore)
                .submittedAt(savedSubmission.getSubmittedAt())
                .isLate(savedSubmission.isLate())
                .build();
    }

    private void validateSubmission(Assignment assignment, Long accountId) {
        // Prevent multiple submissions if needed (Business Rule)
        List<Submission> existingSubmissions = submissionRepository.findByAssignmentIdAndAccountId(assignment.getId(), accountId);
        if (!existingSubmissions.isEmpty()) {
            throw new AppException("You have already submitted this assignment.", HttpStatus.BAD_REQUEST);
        }
    }

    private double processAndGradeAnswers(Submission submission, List<SubmitQuizRequest.StudentAnswerDTO> answers) {
        double totalScore = 0.0;
        for (SubmitQuizRequest.StudentAnswerDTO answerDTO : answers) {
            totalScore += gradeSingleQuestion(submission, answerDTO);
        }
        return totalScore;
    }

    private double gradeSingleQuestion(Submission submission, SubmitQuizRequest.StudentAnswerDTO answerDTO) {
        Question question = questionRepository.findById(answerDTO.getQuestionId())
                .orElseThrow(() -> new AppException("Question not found", HttpStatus.NOT_FOUND));

        List<AnswerOption> studentChoices = answerOptionRepository.findAllById(answerDTO.getSelectedOptionIds());
        
        double earnedPoints = calculatePoints(question, studentChoices);

        StudentAnswer studentAnswer = StudentAnswer.builder()
                .submission(submission)
                .question(question)
                .earnedPoints(earnedPoints)
                .selectedOptions(studentChoices)
                .content(answerDTO.getContent())
                .build();

        studentAnswerRepository.save(studentAnswer);
        return earnedPoints;
    }

    private double calculatePoints(Question question, List<AnswerOption> studentChoices) {
        List<Long> correctOptionIds = answerOptionRepository.findByQuestionId(question.getId())
                .stream()
                .filter(AnswerOption::isCorrect)
                .map(AnswerOption::getId)
                .sorted()
                .collect(Collectors.toList());

        List<Long> studentSelectedIds = studentChoices.stream()
                .map(AnswerOption::getId)
                .sorted()
                .collect(Collectors.toList());

        if (!correctOptionIds.isEmpty() && correctOptionIds.equals(studentSelectedIds)) {
            return question.getPoints() != null ? question.getPoints() : 0.0;
        }
        return 0.0;
    }
}
