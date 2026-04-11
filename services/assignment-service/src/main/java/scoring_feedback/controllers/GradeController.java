package scoring_feedback.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import scoring_feedback.dto.GradeRequest;
import scoring_feedback.dto.GradeResponseDTO;
import scoring_feedback.services.GradeService;

import jakarta.validation.Valid;

/**
 * Controller để xử lý API chấm điểm
 */
@RestController
@RequestMapping("/api/core/submissions")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    /**
     * POST /api/core/submissions/{submissionId}/grade
     * Chấm điểm cho một submission
     *
     * @param submissionId ID của submission
     * @param gradeRequest Yêu cầu chấm điểm (score bắt buộc, feedback tùy chọn)
     * @return Response DTO chứa submission + grade info
     */
    @PostMapping("/{submissionId}/grade")
    public ResponseEntity<GradeResponseDTO> gradeSubmission(
            @PathVariable Long submissionId,
            @Valid @RequestBody GradeRequest gradeRequest) {

        // TODO: Sau này implement lấy teacherId từ JWT token
        Long teacherId = extractTeacherId();

        GradeResponseDTO response = gradeService.gradeSubmission(submissionId, gradeRequest, teacherId);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }

    /**
     * Helper: Lấy teacher ID
     * (Tạm thời return mặc định, cần implement lấy từ JWT)
     */
    private Long extractTeacherId() {
        // TODO: Implement lấy teacher ID từ JWT claims
        return 1L;
    }
}
