package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.models.*;
import fit.iuh.modules.quiz.repositories.AssignmentRepository;
import fit.iuh.modules.quiz.repositories.SubmissionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QuizService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    /**
     * Lấy danh sách bài kiểm tra theo teamId
     */
    public List<AssignmentSummaryDto> getAssignmentsByTeam(Long teamId) {
        return assignmentRepository.findByTeamId(teamId)
                .stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết một bài kiểm tra (kèm câu hỏi, KHÔNG expose đáp án đúng)
     */
    public AssignmentDetailDto getAssignmentDetail(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));
        return toDetailDto(assignment);
    }

    /**
     * Bắt đầu làm bài hoặc resume nếu đã có submission DRAFT
     */
    @Transactional
    public Submission startSubmission(Long assignmentId, Long accountId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));

        // Nếu đã có submission thì resume (không báo lỗi)
        Optional<Submission> existing = submissionRepository.findByAccountIdAndAssignmentId(accountId, assignmentId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Kiểm tra deadline
        boolean isLate = assignment.getDueDate() != null
                && LocalDateTime.now().isAfter(assignment.getDueDate());

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setAccountId(accountId);
        submission.setStatus(SubmissionStatus.DRAFT);
        submission.setCreatedAt(LocalDateTime.now());
        submission.setLate(isLate);
        return submissionRepository.save(submission);
    }

    /**
     * Lấy submission hiện tại của học viên (để kiểm tra resume hay tạo mới)
     */
    public Optional<Submission> getMySubmission(Long assignmentId, Long accountId) {
        return submissionRepository.findByAccountIdAndAssignmentId(accountId, assignmentId);
    }

    /**
     * Auto-save đáp án khi học viên chọn
     */
    @Transactional
    public void saveAnswer(Long submissionId, SubmitAnswerDto dto) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + submissionId));

        if (submission.getStatus() == SubmissionStatus.SUBMITTED) {
            throw new IllegalStateException("Bài thi đã nộp, không thể sửa đáp án.");
        }

        Question question = submission.getAssignment().getQuestions().stream()
                .filter(q -> q.getId().equals(dto.getQuestionId()))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Question not found in assignment"));

        List<AnswerOption> selectedOptions = question.getOptions().stream()
                .filter(opt -> dto.getSelectedOptionIds().contains(opt.getId()))
                .collect(Collectors.toList());

        List<StudentAnswer> answers = submission.getStudentAnswers();
        if (answers == null) answers = new ArrayList<>();

        // Xóa đáp án cũ cho câu này, thêm mới
        answers.removeIf(sa -> sa.getQuestion() != null && sa.getQuestion().getId().equals(question.getId()));

        StudentAnswer newAnswer = new StudentAnswer();
        newAnswer.setSubmission(submission);
        newAnswer.setQuestion(question);
        newAnswer.setSelectedOptions(selectedOptions);
        newAnswer.setEarnedPoints(0.0);

        answers.add(newAnswer);
        submission.setStudentAnswers(answers);
        submissionRepository.save(submission);
    }

    /**
     * Nộp bài và chấm điểm tự động
     */
    @Transactional
    public SubmissionResultDto submitAndGrade(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + submissionId));

        // Nếu đã nộp, trả về kết quả cũ
        if (submission.getStatus() == SubmissionStatus.SUBMITTED && submission.getGrade() != null) {
            return buildResultDto(submission);
        }

        List<Question> questions = submission.getAssignment().getQuestions();
        double totalScore = 0;

        for (StudentAnswer sa : submission.getStudentAnswers()) {
            Question q = sa.getQuestion();
            if (q == null) continue;
            double pts = q.getPoints() != null ? q.getPoints() : 0.0;

            List<Long> correctIds = q.getOptions().stream()
                    .filter(AnswerOption::isCorrect).map(AnswerOption::getId)
                    .collect(Collectors.toList());
            List<Long> selectedIds = sa.getSelectedOptions().stream()
                    .map(AnswerOption::getId).collect(Collectors.toList());

            boolean correct = !correctIds.isEmpty()
                    && correctIds.size() == selectedIds.size()
                    && correctIds.containsAll(selectedIds);

            sa.setEarnedPoints(correct ? pts : 0.0);
            if (correct) totalScore += pts;
        }

        Grade grade = new Grade();
        grade.setScore(totalScore);
        grade.setGradedAt(LocalDateTime.now());
        grade.setRevision(1);
        grade.setGradedBy(0L); // 0 = auto-graded by system
        grade.setFeedback(buildFeedback(totalScore, submission.getAssignment().getMaxScore()));
        grade.setSubmission(submission);

        submission.setGrade(grade);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(submission);
        return buildResultDto(saved);
    }

    // ======== Private Mappers ========

    private AssignmentSummaryDto toSummaryDto(Assignment a) {
        AssignmentSummaryDto dto = new AssignmentSummaryDto();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setInstructions(a.getInstructions());
        dto.setMaxScore(a.getMaxScore());
        dto.setDueDate(a.getDueDate());
        dto.setType(a.getType());
        dto.setTeamIds(a.getTeamIds());
        dto.setArchivedAt(a.getArchivedAt());
        return dto;
    }

    private AssignmentDetailDto toDetailDto(Assignment a) {
        AssignmentDetailDto dto = new AssignmentDetailDto();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setInstructions(a.getInstructions());
        dto.setMaxScore(a.getMaxScore());
        dto.setDueDate(a.getDueDate());
        dto.setType(a.getType());
        dto.setTeamIds(a.getTeamIds());
        dto.setQuestions(a.getQuestions().stream()
                .sorted((x, y) -> Integer.compare(
                        x.getDisplayOrder() != null ? x.getDisplayOrder() : 0,
                        y.getDisplayOrder() != null ? y.getDisplayOrder() : 0))
                .map(this::toQuestionDto)
                .collect(Collectors.toList()));
        return dto;
    }

    private QuestionDto toQuestionDto(Question q) {
        QuestionDto dto = new QuestionDto();
        dto.setId(q.getId());
        dto.setContent(q.getContent());
        dto.setType(q.getType());
        dto.setPoints(q.getPoints());
        dto.setDisplayOrder(q.getDisplayOrder());
        dto.setOptions(q.getOptions().stream()
                .sorted((x, y) -> Integer.compare(
                        x.getDisplayOrder() != null ? x.getDisplayOrder() : 0,
                        y.getDisplayOrder() != null ? y.getDisplayOrder() : 0))
                .map(this::toAnswerOptionDto)
                .collect(Collectors.toList()));
        return dto;
    }

    private AnswerOptionDto toAnswerOptionDto(AnswerOption opt) {
        AnswerOptionDto dto = new AnswerOptionDto();
        dto.setId(opt.getId());
        dto.setContent(opt.getContent());
        dto.setDisplayOrder(opt.getDisplayOrder());
        // isCorrect KHÔNG được expose ra response để tránh gian lận
        return dto;
    }

    private SubmissionResultDto buildResultDto(Submission s) {
        int total = s.getAssignment().getQuestions().size();
        int answered = s.getStudentAnswers() != null ? s.getStudentAnswers().size() : 0;

        SubmissionResultDto dto = new SubmissionResultDto();
        dto.setSubmissionId(s.getId());
        dto.setScore(s.getGrade() != null ? s.getGrade().getScore() : 0.0);
        dto.setMaxScore(s.getAssignment().getMaxScore());
        dto.setFeedback(s.getGrade() != null ? s.getGrade().getFeedback() : "");
        dto.setTotalQuestions(total);
        dto.setAnsweredQuestions(answered);
        return dto;
    }

    private String buildFeedback(double score, Double maxScore) {
        if (maxScore == null || maxScore == 0) return "Đã chấm điểm tự động.";
        double pct = (score / maxScore) * 100;
        if (pct >= 90) return String.format("Xuất sắc! Bạn đạt %.1f/%.1f điểm.", score, maxScore);
        if (pct >= 75) return String.format("Giỏi! Bạn đạt %.1f/%.1f điểm.", score, maxScore);
        if (pct >= 60) return String.format("Khá! Bạn đạt %.1f/%.1f điểm.", score, maxScore);
        if (pct >= 50) return String.format("Trung bình. Bạn đạt %.1f/%.1f điểm.", score, maxScore);
        return String.format("Cần cố gắng thêm. Bạn đạt %.1f/%.1f điểm.", score, maxScore);
    }
}
