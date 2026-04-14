package create_assignment.controllers;

import create_assignment.config.UserAuthenticationFilter;
import create_assignment.dto.AssignmentRequestDTO;
import create_assignment.dto.AssignmentResponseDTO;
import create_assignment.services.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * POST /api/assignments
     * Tạo bài tập mới (TEACHER only).
     *
     * @param dto            thông tin bài tập
     * @param authentication thông tin người dùng từ header (Nginx gắn)
     * @return 201 Created + AssignmentResponseDTO
     */
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<AssignmentResponseDTO> createAssignment(
            @RequestBody AssignmentRequestDTO dto,
            Authentication authentication) {
        try {
            System.out.println("📝 Received DTO: " + dto);
            System.out.println("   - Title: " + dto.getTitle());
            System.out.println("   - DueDate: " + dto.getDueDate() + " (type: "
                    + (dto.getDueDate() != null ? dto.getDueDate().getClass().getName() : "null") + ")");
            System.out.println("   - MaxScore: " + dto.getMaxScore() + " (type: "
                    + (dto.getMaxScore() != null ? dto.getMaxScore().getClass().getSimpleName() : "null") + ")");
            System.out.println("   - Type: " + dto.getType());
            System.out.println("   - TeamId: " + dto.getTeamId());

            // Lấy teacherId từ Authentication
            Long teacherId = extractUserIdFromAuthentication(authentication);
            System.out.println("   - TeacherId extracted: " + teacherId);

            // Có thể lưu teacherId vào assignment nếu cần (tùy design)
            AssignmentResponseDTO response = assignmentService.createAssignment(dto);
            System.out.println("✅ Assignment created with ID: " + response.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("❌ Error in createAssignment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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

    /**
     * Trích xuất userId từ Authentication object
     * Authentication principal là AuthenticatedUser (từ UserAuthenticationFilter)
     */
    private Long extractUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin người dùng");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserAuthenticationFilter.AuthenticatedUser) {
            return ((UserAuthenticationFilter.AuthenticatedUser) principal).getUserId();
        }
        throw new IllegalArgumentException("Không thể trích xuất userId từ Authentication");
    }
}
