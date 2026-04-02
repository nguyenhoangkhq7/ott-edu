package create_assignment.controllers;

import create_assignment.dto.AssignmentRequestDTO;
import create_assignment.dto.AssignmentResponseDTO;
import create_assignment.services.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * POST /api/assignments
     * <p>Tạo bài tập mới. Yêu cầu quyền ROLE_TEACHER.</p>
     *
     * @param dto thông tin bài tập
     * @return 201 Created + AssignmentResponseDTO
     */
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<AssignmentResponseDTO> createAssignment(
            @RequestBody AssignmentRequestDTO dto) {

        AssignmentResponseDTO response = assignmentService.createAssignment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
