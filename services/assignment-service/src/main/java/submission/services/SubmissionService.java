package submission.services;

import submission.entities.Submission;
import submission.entities.StudentAnswer;
import submission.dto.SubmissionRequestDTO;
import submission.dto.SubmissionResponseDTO;
import submission.dto.StudentAnswerDTO;
import submission.repositories.SubmissionRepository;

import create_assignment.entities.Assignment;
import create_assignment.entities.AnswerOption;
import create_assignment.entities.Question;
import create_assignment.entities.Material;
import create_assignment.enums.AssignmentType;
import create_assignment.repositories.AssignmentRepository;
import create_assignment.repositories.QuestionRepository;
import create_assignment.repositories.AnswerOptionRepository;
import create_assignment.repositories.MaterialRepository;

import assign_homework.enums.SubmissionStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service: SubmissionService
 * Quản lý logic nộp bài của sinh viên
 * 
 * Core Methods:
 * - submitAssignment: Nộp bài (ESSAY hoặc QUIZ)
 * - calculateQuizScore: Tính điểm tự động cho Quiz
 * - getSubmissionById: Lấy thông tin bài nộp
 * - getSubmissionsByStudent: Lấy tất cả bài nộp của sinh viên
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;
    private final MaterialRepository materialRepository;

    /**
     * Phương thức chính: Nộp bài tập
     * 
     * Quy trình:
     * 1. Xác thực Assignment (tồn tại, published, có deadline)
     * 2. Kiểm tra deadline - nếu quá hạn, set isLate = true
     * 3. Xử lý logic Quiz: Tính điểm tự động từ đáp án đúng
     * 4. Lưu Submission + StudentAnswer trong transaction
     * 5. Trả về SubmissionResponseDTO
     * 
     * @param assignmentId ID của Assignment
     * @param studentId    ID của sinh viên (từ JWT Token)
     * @param dto          SubmissionRequestDTO (content, materialIds, answers)
     * @return SubmissionResponseDTO
     * @throws IllegalArgumentException nếu Assignment không tồn tại hoặc không được
     *                                  publish
     */
    @Transactional
    public SubmissionResponseDTO submitAssignment(
            Long assignmentId,
            Long studentId,
            SubmissionRequestDTO dto) {
        log.info("Student {} submitting assignment {}", studentId, assignmentId);

        // ============================================================================
        // 1. VALIDATION: Kiểm tra Assignment tồn tại và được publish
        // ============================================================================
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> {
                    log.error("Assignment {} not found", assignmentId);
                    return new IllegalArgumentException("Assignment not found with id: " + assignmentId);
                });

        if (!assignment.getIsPublished()) {
            log.error("Assignment {} is not published", assignmentId);
            throw new IllegalArgumentException("Assignment is not published. Students cannot submit.");
        }

        // ============================================================================
        // 2. CHECK EXISTING SUBMISSION: Xem có submission cũ không
        // ============================================================================
        Optional<Submission> existingSubmission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId);

        Submission submission;
        if (existingSubmission.isPresent()) {
            // Update submission cũ (re-submission)
            log.info("Re-submission detected for student {} on assignment {}", studentId, assignmentId);
            submission = existingSubmission.get();
            // Xóa các câu trả lời cũ nếu là Quiz
            if (assignment.getType() == AssignmentType.QUIZ) {
                submission.getStudentAnswers().clear();
            }
        } else {
            // Tạo submission mới
            submission = Submission.builder()
                    .assignment(assignment)
                    .studentId(studentId)
                    .teamId(assignment.getTeamId())
                    .status(SubmissionStatus.SUBMITTED)
                    .build();
        }

        // ============================================================================
        // 3. CHECK DEADLINE: So sánh thời gian hiện tại với dueDate
        // ============================================================================
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueDate = assignment.getDueDate();
        boolean isLate = now.isAfter(dueDate);

        log.debug("Current time: {}, Due date: {}, Is late: {}", now, dueDate, isLate);
        submission.setIsLate(isLate);

        // ============================================================================
        // 4. SET SUBMISSION METADATA
        // ============================================================================
        submission.setContent(dto.getContent());
        submission.setSubmittedAt(now);
        submission.setStatus(SubmissionStatus.SUBMITTED);

        // ============================================================================
        // 5. HANDLE MATERIALS (File đính kèm)
        // ============================================================================
        if (dto.getMaterialIds() != null && !dto.getMaterialIds().isEmpty()) {
            List<Material> materials = materialRepository.findAllById(dto.getMaterialIds());
            submission.setMaterials(materials);
            log.debug("Attached {} materials to submission", materials.size());
        }

        // ============================================================================
        // 6. HANDLE QUIZ LOGIC: Tính điểm tự động
        // ============================================================================
        if (assignment.getType() == AssignmentType.QUIZ) {
            Double quizScore = processQuizSubmission(submission, assignment, dto);
            submission.setScore(quizScore);
            log.info("Quiz score calculated: {}", quizScore);
        } else {
            // Đối với ESSAY, score ban đầu là NULL (do giáo viên chấm)
            submission.setScore(null);
        }

        // ============================================================================
        // 7. SAVE SUBMISSION & STUDENT ANSWERS (TRANSACTIONAL)
        // ============================================================================
        Submission savedSubmission = submissionRepository.save(submission);
        log.info("Submission saved with id: {}", savedSubmission.getId());

        // ============================================================================
        // 8. BUILD & RETURN RESPONSE DTO
        // ============================================================================
        return convertToResponseDTO(savedSubmission);
    }

    /**
     * Xử lý Quiz Submission: Tính điểm tự động
     * 
     * Quy trình:
     * 1. Lặp qua danh sách answers từ request
     * 2. Với mỗi answer: Lấy option được chọn, kiểm tra isCorrect
     * 3. Nếu correct: earnedPoints = 1 điểm (hoặc có thể cấu hình)
     * 4. Nếu sai: earnedPoints = 0
     * 5. Tổng điểm tất cả câu trả lời
     * 6. Lưu StudentAnswer records
     * 
     * @param submission Submission entity
     * @param assignment Assignment entity
     * @param dto        SubmissionRequestDTO chứa answers
     * @return Tổng điểm Quiz
     */
    private Double processQuizSubmission(
            Submission submission,
            Assignment assignment,
            SubmissionRequestDTO dto) {
        log.info("Processing Quiz submission for assignment {}", assignment.getId());

        if (dto.getAnswers() == null || dto.getAnswers().isEmpty()) {
            log.warn("No answers provided for quiz submission");
            return 0.0;
        }

        Double totalScore = 0.0;
        List<StudentAnswer> studentAnswers = new ArrayList<>();

        // Lặp qua từng answer trong request
        for (var answerDTO : dto.getAnswers()) {
            Long questionId = answerDTO.getQuestionId();
            Long selectedOptionId = answerDTO.getSelectedOptionId();

            log.debug("Processing answer for question: {}, selected option: {}", questionId, selectedOptionId);

            // Lấy Question
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));

            // Khởi tạo StudentAnswer
            StudentAnswer studentAnswer = StudentAnswer.builder()
                    .submission(submission)
                    .question(question)
                    .earnedPoints(0.0) // Mặc định là 0
                    .build();

            // Nếu sinh viên chọn option
            if (selectedOptionId != null && selectedOptionId > 0) {
                AnswerOption selectedOption = answerOptionRepository.findById(selectedOptionId)
                        .orElseThrow(() -> new IllegalArgumentException("Option not found: " + selectedOptionId));

                studentAnswer.setSelectedOption(selectedOption);

                // Kiểm tra xem option được chọn có phải đáp án đúng không
                if (Boolean.TRUE.equals(selectedOption.getIsCorrect())) {
                    // Cách tính điểm: 1 điểm cho mỗi câu đúng
                    // (Có thể tùy chỉnh: maxScore / numberOfQuestions)
                    Double pointsPerQuestion = 1.0;
                    studentAnswer.setEarnedPoints(pointsPerQuestion);
                    totalScore += pointsPerQuestion;
                    log.debug("Correct answer selected. Points: {}", pointsPerQuestion);
                } else {
                    log.debug("Wrong answer selected. Points: 0");
                }
            } else {
                log.debug("No option selected for question: {}. Points: 0", questionId);
            }

            studentAnswers.add(studentAnswer);
        }

        // Lưu tất cả StudentAnswer
        submission.setStudentAnswers(studentAnswers);
        log.info("Quiz processing complete. Total score: {}", totalScore);

        return totalScore;
    }

    /**
     * Lấy thông tin Submission theo ID
     */
    public SubmissionResponseDTO getSubmissionById(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
        return convertToResponseDTO(submission);
    }

    /**
     * Lấy Submission của sinh viên cho một Assignment cụ thể
     */
    public Optional<SubmissionResponseDTO> getSubmissionByAssignmentAndStudent(
            Long assignmentId,
            Long studentId) {
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .map(this::convertToResponseDTO);
    }

    /**
     * Lấy tất cả Submission của một sinh viên
     */
    public List<SubmissionResponseDTO> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả Submission của một Assignment
     */
    public List<SubmissionResponseDTO> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert Entity Submission → DTO
     */
    private SubmissionResponseDTO convertToResponseDTO(Submission submission) {
        return SubmissionResponseDTO.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .studentId(submission.getStudentId())
                .content(submission.getContent())
                .score(submission.getScore())
                .feedback(submission.getFeedback())
                .status(submission.getStatus())
                .isLate(submission.getIsLate())
                .submittedAt(submission.getSubmittedAt())
                .gradedAt(submission.getGradedAt())
                .createdAt(submission.getCreatedAt())
                .updatedAt(submission.getUpdatedAt())
                .studentAnswers(
                        submission.getStudentAnswers().stream()
                                .map(sa -> StudentAnswerDTO.builder()
                                        .questionId(sa.getQuestion().getId())
                                        .selectedOptionId(
                                                sa.getSelectedOption() != null ? sa.getSelectedOption().getId() : null)
                                        .earnedPoints(sa.getEarnedPoints())
                                        .build())
                                .toList())
                .build();
    }
}
