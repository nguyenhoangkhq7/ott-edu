package fit.iuh.modules.quiz.controllers;

import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.models.Assignment;
import fit.iuh.modules.quiz.models.Submission;
import fit.iuh.modules.quiz.services.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/assignments")
public class QuizController {

    @Autowired
    private QuizService quizService;

    /**
     * GET /assignments/team/{teamId}
     * Lấy danh sách bài kiểm tra theo lớp học (teamId)
     */
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<AssignmentSummaryDto>> getAssignmentsByTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(quizService.getAssignmentsByTeam(teamId));
    }

    /**
     * GET /assignments/{assignmentId}
     * Lấy chi tiết bài kiểm tra kèm câu hỏi (KHÔNG tiết lộ đáp án đúng)
     */
    @GetMapping("/{assignmentId}")
    public ResponseEntity<AssignmentDetailDto> getAssignmentDetail(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(quizService.getAssignmentDetail(assignmentId));
    }

    /**
     * POST /assignments/{assignmentId}/start
     * Bắt đầu làm bài - trả về submission (tạo mới hoặc resume nếu đã có)
     */
    @PostMapping("/{assignmentId}/start")
    public ResponseEntity<Submission> startSubmission(
            @PathVariable Long assignmentId,
            @RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(quizService.startSubmission(assignmentId, studentId));
    }

    /**
     * GET /assignments/{assignmentId}/my-submission
     * Kiểm tra học viên đã có submission chưa (để biết là resume hay bắt đầu mới)
     */
    @GetMapping("/{assignmentId}/my-submission")
    public ResponseEntity<Optional<Submission>> getMySubmission(
            @PathVariable Long assignmentId,
            @RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(quizService.getMySubmission(assignmentId, studentId));
    }

    /**
     * POST /assignments/submission/{submissionId}/answer
     * Auto-save đáp án khi học viên chọn
     */
    @PostMapping("/submission/{submissionId}/answer")
    public ResponseEntity<Void> saveAnswer(
            @PathVariable Long submissionId,
            @RequestBody SubmitAnswerDto answerDto) {
        quizService.saveAnswer(submissionId, answerDto);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /assignments/submission/{submissionId}/submit
     * Nộp bài và chấm điểm
     */
    @PostMapping("/submission/{submissionId}/submit")
    public ResponseEntity<SubmissionResultDto> submitAndGrade(@PathVariable Long submissionId) {
        return ResponseEntity.ok(quizService.submitAndGrade(submissionId));
    }
}
