package view_results.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import view_results.dto.GradeResponseDTO;
import view_results.dto.SubmissionHistoryDTO;
import view_results.services.ViewResultService;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller để xem kết quả chấm điểm
 * <p>
 * Endpoints:
 * - GET /api/assignments/{assignmentId}/my-result: Xem kết quả chấm của chính
 * mình
 * - GET /api/assignments/{assignmentId}/history: Xem lịch sử nộp bài
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class ViewResultController {

    private final ViewResultService viewResultService;

    /**
     * GET /api/assignments/{assignmentId}/my-result
     * <p>
     * Sinh viên xem kết quả chấm của chính mình cho một bài tập
     * </p>
     *
     * @param assignmentId ID của bài tập
     * @return 200 OK + GradeResponseDTO
     *         hoặc 403 Forbidden nếu không phải chủ sở hữu
     *         hoặc 404 Not Found nếu bài tập không tồn tại
     */
    @GetMapping("/{assignmentId}/my-result")
    public ResponseEntity<?> getMyResult(
            @PathVariable Long assignmentId) {
        try {
            Long studentId = 1L;

            log.info("Student {} requesting result for assignment {}", studentId, assignmentId);

            // ---- Kiểm tra quyền ----
            if (!viewResultService.canViewResult(assignmentId, studentId, studentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Bạn không có quyền xem kết quả này"));
            }

            // ---- Lấy kết quả ----
            GradeResponseDTO result = viewResultService.getStudentResult(assignmentId, studentId);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Bad request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting student result", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy kết quả"));
        }
    }

    /**
     * GET /api/assignments/{assignmentId}/history
     * <p>
     * Sinh viên xem lịch sử nộp bài (cho các bài tập cho phép revision/nộp nhiều
     * lần)
     * </p>
     *
     * @param assignmentId ID của bài tập
     * @return 200 OK + List<SubmissionHistoryDTO>
     *         hoặc 403 Forbidden nếu không phải chủ sở hữu
     *         hoặc 404 Not Found nếu bài tập không tồn tại
     */
    @GetMapping("/{assignmentId}/history")
    public ResponseEntity<?> getSubmissionHistory(
            @PathVariable Long assignmentId) {
        try {
            Long studentId = 1L;

            log.info("Student {} requesting submission history for assignment {}", studentId, assignmentId);

            // ---- Kiểm tra quyền ----
            if (!viewResultService.canViewResult(assignmentId, studentId, studentId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Bạn không có quyền xem lịch sử này"));
            }

            // ---- Lấy lịch sử ----
            List<SubmissionHistoryDTO> history = viewResultService.getSubmissionHistory(assignmentId, studentId);
            return ResponseEntity.ok(history);

        } catch (IllegalArgumentException e) {
            log.error("Bad request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting submission history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi khi lấy lịch sử nộp bài"));
        }
    }

    /**
     * Tạo error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", message);
        response.put("timestamp", java.time.LocalDateTime.now());
        return response;
    }
}
