package create_assignment.controllers;

import create_assignment.dto.AssignmentRequestDTO;
import create_assignment.dto.AssignmentResponseDTO;
import create_assignment.services.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * POST /api/assignments
     * Tạo bài tập mới.
     *
     * @param dto thông tin bài tập
     * @return 201 Created + AssignmentResponseDTO
     */
    @PostMapping
    public ResponseEntity<AssignmentResponseDTO> createAssignment(
            @RequestBody AssignmentRequestDTO dto) {
        System.out.println(dto);
        AssignmentResponseDTO response = assignmentService.createAssignment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/assignments
     * Lấy tất cả bài tập trong hệ thống.
     *
     * @return 200 OK + danh sách tất cả AssignmentResponseDTO
     */
    @GetMapping
    public ResponseEntity<List<AssignmentResponseDTO>> getAllAssignments() {
        List<AssignmentResponseDTO> assignments = assignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    /**
     * GET /api/assignments/teams/{teamId}
     * Lấy danh sách bài tập của một team.
     *
     * @param teamId ID của team
     * @return 200 OK + danh sách AssignmentResponseDTO
     */
    @GetMapping("/teams/{teamId}")
    public ResponseEntity<List<AssignmentResponseDTO>> getAssignmentsByTeam(
            @PathVariable Long teamId) {
        List<AssignmentResponseDTO> assignments = assignmentService.getAssignmentsByTeam(teamId);
        return ResponseEntity.ok(assignments);
    }

    /**
     * GET /api/assignments/{id}
     * Lấy chi tiết một bài tập
     */
    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponseDTO> getAssignmentById(@PathVariable Long id) {
        AssignmentResponseDTO assignment = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(assignment);
    }
}
