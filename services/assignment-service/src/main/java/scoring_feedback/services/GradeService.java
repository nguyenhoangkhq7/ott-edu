package scoring_feedback.services;

import assign_homework.entities.Submission;
import assign_homework.enums.SubmissionStatus;
import assign_homework.repositories.SubmissionRepository;
import create_assignment.entities.Assignment;
import create_assignment.exceptions.BadRequestException;
import create_assignment.repositories.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import scoring_feedback.dto.GradeRequest;
import scoring_feedback.dto.GradeResponseDTO;
import scoring_feedback.entities.Grade;
import scoring_feedback.entities.GradeLog;
import scoring_feedback.repositories.GradeLogRepository;
import scoring_feedback.repositories.GradeRepository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service để xử lý logic chấm điểm (grading)
 * - Nhận GradeRequest
 * - Validate submission tồn tại & quyền
 * - Lưu hoặc update Grade
 * - Cập nhật Submission status → GRADED
 * - Log thay đổi
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GradeService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final GradeRepository gradeRepository;
    private final GradeLogRepository gradeLogRepository;

    /**
     * Chấm điểm cho một submission
     *
     * @param submissionId ID của submission
     * @param gradeRequest Yêu cầu chấm điểm (score, feedback)
     * @param teacherId    ID của giáo viên chấm bài
     * @return Response DTO chứa info submission + grade
     */
    @Transactional
    public GradeResponseDTO gradeSubmission(Long submissionId, GradeRequest gradeRequest, Long teacherId) {
        log.info("Grading submission: submissionId={}, teacher={}, score={}", submissionId, teacherId,
                gradeRequest.getScore());

        // ---- 1. Tìm Submission ----
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BadRequestException("Submission không tồn tại với ID: " + submissionId));

        log.info("Found submission: id={}, assignmentId={}, studentId={}", submission.getId(),
                submission.getAssignmentId(), submission.getStudentId());

        // ---- 2. Lấy Assignment để kiểm tra maxScore ----
        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new BadRequestException(
                        "Assignment không tồn tại với ID: " + submission.getAssignmentId()));

        // ---- 3. Validate score nằm trong [0, maxScore] ----
        Double score = gradeRequest.getScore();
        if (score < 0 || score > assignment.getMaxScore()) {
            throw new BadRequestException(
                    String.format("Score phải nằm trong khoảng từ 0 đến %.1f (maxScore của bài tập)",
                            assignment.getMaxScore()));
        }

        // ---- 4. Kiểm tra xem Grade đã tồn tại chưa (update hoặc create) ----
        Optional<Grade> existingGrade = gradeRepository.findBySubmissionId(submissionId);
        Grade grade;

        if (existingGrade.isPresent()) {
            // ---- Update Grade (giáo viên sửa điểm) ----
            grade = existingGrade.get();
            Double oldScore = grade.getScore();
            String oldFeedback = grade.getFeedback();

            grade.setScore(score);
            grade.setFeedback(gradeRequest.getFeedback());
            grade.setGradedByTeacherId(teacherId);
            grade.setGradedAt(LocalDateTime.now());
            grade.setUpdatedAt(LocalDateTime.now());

            grade = gradeRepository.save(grade);
            log.info("Grade updated: id={}, oldScore={}, newScore={}", grade.getId(), oldScore, score);

            // ---- Log: UPDATED ----
            createGradeLog(grade.getId(), "UPDATED",
                    String.format("Score changed from %.1f to %.1f", oldScore, score),
                    teacherId);

        } else {
            // ---- Create new Grade ----
            grade = Grade.builder()
                    .submissionId(submissionId)
                    .gradedByTeacherId(teacherId)
                    .score(score)
                    .feedback(gradeRequest.getFeedback())
                    .gradedAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            grade = gradeRepository.save(grade);
            log.info("Grade created: id={}, submissionId={}, score={}", grade.getId(), submissionId, score);

            // ---- Log: CREATED ----
            createGradeLog(grade.getId(), "CREATED",
                    String.format("Grade created with score %.1f", score),
                    teacherId);
        }

        // ---- 5. Cập nhật submission status → GRADED ----
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setScore(score);
        submission.setFeedback(gradeRequest.getFeedback());
        submission.setUpdatedAt(LocalDateTime.now());
        submissionRepository.save(submission);
        log.info("Submission status updated to GRADED: id={}", submissionId);

        // ---- 6. Trả về Response ----
        return GradeResponseDTO.builder()
                .submissionId(submissionId)
                .assignmentId(submission.getAssignmentId())
                .studentId(submission.getStudentId())
                .teamId(submission.getTeamId())
                .status(submission.getStatus())
                .gradeId(grade.getId())
                .score(grade.getScore())
                .feedback(grade.getFeedback())
                .gradedAt(grade.getGradedAt())
                .gradedByTeacherId(grade.getGradedByTeacherId())
                .message(String.format("Submission #%d đã được chấm điểm thành công. Điểm: %.1f/%.1f",
                        submissionId, score, assignment.getMaxScore()))
                .build();
    }

    /**
     * Helper: Tạo log cho grade
     */
    private void createGradeLog(Long gradeId, String action, String details, Long changedByTeacherId) {
        GradeLog logEntity = GradeLog.builder()
                .gradeId(gradeId)
                .action(action)
                .details(details)
                .changedByTeacherId(changedByTeacherId)
                .build();

        gradeLogRepository.save(logEntity);
        log.debug("GradeLog created: gradeId={}, action={}", gradeId, action);
    }

    /**
     * Lấy Grade của một submission
     */
    public Optional<Grade> getGradeForSubmission(Long submissionId) {
        return gradeRepository.findBySubmissionId(submissionId);
    }
}
