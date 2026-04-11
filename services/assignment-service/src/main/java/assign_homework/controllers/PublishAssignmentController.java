package assign_homework.controllers;

import assign_homework.dto.PublishAssignmentResponseDTO;
import assign_homework.services.AssignmentPublishService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<PublishAssignmentResponseDTO> publishAssignment(
            @PathVariable("id") Long assignmentId) {

        String teacherName = "teacher";
        Long teacherId = 1L;

        PublishAssignmentResponseDTO response = assignmentPublishService.publishAssignment(
                assignmentId,
                teacherId,
                teacherName);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }

}
