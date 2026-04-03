package fit.iuh.controllers;

import fit.iuh.dtos.AssignmentDTO;
import fit.iuh.dtos.responses.ApiResponse;
import fit.iuh.services.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<AssignmentDTO>> createAssignment(@RequestBody AssignmentDTO assignmentDTO) {
        AssignmentDTO result = assignmentService.createAssignment(assignmentDTO);
        return ResponseEntity.ok(ApiResponse.success(result, "Assignment created successfully"));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<ApiResponse<List<AssignmentDTO>>> getAssignmentsByTeamId(@PathVariable Long teamId) {
        List<AssignmentDTO> result = assignmentService.getAssignmentsByTeamId(teamId);
        return ResponseEntity.ok(ApiResponse.success(result, "Assignments retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssignmentDTO>> getAssignmentById(@PathVariable Long id) {
        AssignmentDTO result = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Assignment retrieved successfully"));
    }
}
