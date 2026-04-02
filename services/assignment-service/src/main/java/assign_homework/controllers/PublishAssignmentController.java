package assign_homework.controllers;

import assign_homework.dto.PublishAssignmentResponseDTO;
import assign_homework.services.AssignmentPublishService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller để xử lý các API liên quan đến "giao bài tập" (publish assignment)
 */
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class PublishAssignmentController {

    private final AssignmentPublishService assignmentPublishService;

    /**
     * PATCH /api/assignments/{id}/publish
     * Giao bài tập cho sinh viên
     *
     * @param assignmentId ID bài tập
     * @return Response DTO
     */
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<PublishAssignmentResponseDTO> publishAssignment(
            @PathVariable("id") Long assignmentId,
            Authentication authentication) {

        // Lấy thông tin từ security context
        // TODO: Sau đó cần validate xem teacher này có sở hữu team/assignment không
        String teacherName = authentication.getName();
        Long teacherId = extractTeacherId(authentication);

        PublishAssignmentResponseDTO response = assignmentPublishService.publishAssignment(
                assignmentId,
                teacherId,
                teacherName);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }

    /**
     * Helper: Lấy teacher ID từ Authentication
     * (Trong production sử dụng JWT token để lấy thông tin)
     */
    private Long extractTeacherId(Authentication authentication) {
        // TODO: Implement lấy teacher ID từ JWT claims hoặc user details
        // Tạm thời return mặc định
        return 1L;
    }
}
