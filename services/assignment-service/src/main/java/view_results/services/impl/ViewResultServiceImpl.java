package view_results.services.impl;

import create_assignment.entities.AnswerOption;
import create_assignment.entities.Assignment;
import create_assignment.entities.Question;
import create_assignment.enums.AssignmentType;
import create_assignment.exceptions.BadRequestException;
import create_assignment.repositories.AnswerOptionRepository;
import create_assignment.repositories.AssignmentRepository;
import create_assignment.repositories.QuestionRepository;
import submission.entities.Submission;
import assign_homework.enums.SubmissionStatus;
import submission.repositories.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import scoring_feedback.entities.Grade;
import scoring_feedback.entities.StudentAnswer;
import scoring_feedback.repositories.GradeRepository;
import scoring_feedback.repositories.StudentAnswerFeedbackRepository;
import view_results.dto.GradeResponseDTO;
import view_results.dto.IncorrectAnswerDTO;
import view_results.dto.SubmissionHistoryDTO;
import view_results.services.ViewResultService;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Triển khai service để xem kết quả chấm điểm
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ViewResultServiceImpl implements ViewResultService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final GradeRepository gradeRepository;
    private final StudentAnswerFeedbackRepository studentAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;

    @Override
    public GradeResponseDTO getStudentResult(Long assignmentId, Long studentId) {
        log.info("Getting student result: assignmentId={}, studentId={}", assignmentId, studentId);

        // ---- 1. Lấy thông tin bài tập ----
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new BadRequestException("Bài tập không tồn tại với ID: " + assignmentId));

        // ---- 2. Tìm submissions của sinh viên cho bài tập này ----
        Optional<Submission> submissionOpt = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId);

        if (submissionOpt.isEmpty()) {
            // Chưa có submission → Chưa nộp bài
            return GradeResponseDTO.builder()
                    .assignmentId(assignmentId)
                    .assignmentTitle(assignment.getTitle())
                    .assignmentType(assignment.getType().toString())
                    .submissionStatus(SubmissionStatus.NOT_SUBMITTED.toString())
                    .message("Bạn chưa nộp bài tập này")
                    .build();
        }

        Submission submission = submissionOpt.get();

        // ---- 3. Xây dựng response cơ bản ----
        GradeResponseDTO.GradeResponseDTOBuilder responseBuilder = GradeResponseDTO.builder()
                .assignmentId(assignmentId)
                .assignmentTitle(assignment.getTitle())
                .assignmentType(assignment.getType().toString())
                .submissionStatus(submission.getStatus().toString())
                .maxScore(assignment.getMaxScore())
                .submittedAt(submission.getSubmittedAt())
                .submissionContent(submission.getContent());

        // ---- 4. Nếu đã GRADED, lấy điểm và nhận xét từ bảng grades ----
        if (submission.getStatus() == SubmissionStatus.GRADED) {
            Optional<Grade> gradeOpt = gradeRepository.findBySubmissionId(submission.getId());

            if (gradeOpt.isPresent()) {
                Grade grade = gradeOpt.get();
                responseBuilder
                        .score(grade.getScore())
                        .feedback(grade.getFeedback())
                        .gradedAt(grade.getGradedAt());

                // ---- 5. Nếu là QUIZ, lấy danh sách câu trả lời sai ----
                if (assignment.getType() == AssignmentType.QUIZ) {
                    List<IncorrectAnswerDTO> incorrectAnswers = this.getIncorrectAnswers(submission.getId());
                    responseBuilder.incorrectAnswers(incorrectAnswers);
                }
            } else {
                responseBuilder.message("Bài tập đã được đánh dấu là GRADED nhưng không tìm thấy thông tin chấm");
            }
        } else if (submission.getStatus() == SubmissionStatus.SUBMITTED) {
            responseBuilder.message("Bài tập của bạn đã được nộp nhưng chưa được chấm điểm");
        } else if (submission.getStatus() == SubmissionStatus.REJECTED) {
            responseBuilder.message("Bài tập của bạn đã bị từ chối");
        } else if (submission.getStatus() == SubmissionStatus.DEADLINE_PASSED) {
            responseBuilder.message("Hạn nộp bài đã qua");
        }

        return responseBuilder.build();
    }

    @Override
    public List<SubmissionHistoryDTO> getSubmissionHistory(Long assignmentId, Long studentId) {
        log.info("Getting submission history: assignmentId={}, studentId={}", assignmentId, studentId);

        // Lấy tất cả submissions của sinh viên cho bài tập (nếu cho phép revision)
        Optional<Submission> submissionOpt = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId);

        if (submissionOpt.isEmpty()) {
            return Collections.emptyList();
        }

        Submission submission = submissionOpt.get();

        // Nếu hiện tại chỉ có 1 submission per student, tạo list chỉ với submission này
        // Trong tương lai có thể mở rộng để hỗ trợ nhiều revisions
        List<SubmissionHistoryDTO> history = new ArrayList<>();

        SubmissionHistoryDTO.SubmissionHistoryDTOBuilder historyBuilder = SubmissionHistoryDTO.builder()
                .submissionId(submission.getId())
                .revisionNumber(1)
                .status(submission.getStatus().toString())
                .submittedAt(submission.getSubmittedAt())
                .content(submission.getContent());

        // Lấy thông tin grade nếu có
        Optional<Grade> gradeOpt = gradeRepository.findBySubmissionId(submission.getId());
        if (gradeOpt.isPresent()) {
            Grade grade = gradeOpt.get();
            historyBuilder
                    .score(grade.getScore())
                    .feedback(grade.getFeedback())
                    .gradedAt(grade.getGradedAt());
        }

        history.add(historyBuilder.build());
        return history;
    }

    @Override
    public boolean canViewResult(Long assignmentId, Long studentId, Long requestingUserId) {
        // Chỉ cho phép sinh viên xem kết quả của chính mình
        return studentId.equals(requestingUserId);
    }

    /**
     * Lấy danh sách các câu trả lời sai của sinh viên (cho QUIZ)
     */
    private List<IncorrectAnswerDTO> getIncorrectAnswers(Long submissionId) {
        List<StudentAnswer> incorrectAnswers = studentAnswerRepository
                .findBySubmissionIdAndIsCorrectFalse(submissionId);

        return incorrectAnswers.stream()
                .map(studentAnswer -> {
                    // Lấy thông tin câu hỏi
                    Question question = questionRepository.findById(studentAnswer.getQuestionId())
                            .orElse(null);

                    String questionContent = question != null ? question.getContent() : "Câu hỏi không tìm thấy";

                    // Lấy đáp án được chọn
                    String selectedAnswer = "Không chọn";
                    if (studentAnswer.getSelectedAnswerId() != null) {
                        Optional<AnswerOption> selectedOpt = answerOptionRepository
                                .findById(studentAnswer.getSelectedAnswerId());
                        if (selectedOpt.isPresent()) {
                            selectedAnswer = selectedOpt.get().getContent();
                        }
                    }

                    // Lấy đáp án đúng
                    String correctAnswer = "Không tìm thấy";
                    if (question != null && !question.getAnswerOptions().isEmpty()) {
                        Optional<AnswerOption> correctOpt = question.getAnswerOptions().stream()
                                .filter(AnswerOption::getIsCorrect)
                                .findFirst();
                        if (correctOpt.isPresent()) {
                            correctAnswer = correctOpt.get().getContent();
                        }
                    }

                    return IncorrectAnswerDTO.builder()
                            .questionId(studentAnswer.getQuestionId())
                            .questionContent(questionContent)
                            .selectedAnswer(selectedAnswer)
                            .correctAnswer(correctAnswer)
                            .explanation("Xem lại câu hỏi này")
                            .build();
                })
                .collect(Collectors.toList());
    }
}
