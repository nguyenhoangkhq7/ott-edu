package fit.iuh.modules.quiz.controllers;

import fit.iuh.common.utils.AuthUtil;
import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.services.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Assignment management.
 * 
 * Handles both TEACHER and STUDENT operations:
 * - TEACHER: Create, update, list, and archive assignments
 * - STUDENT: View assignments for their team and assignment details
 * 
 * All endpoints require authentication. Role-based access control is enforced
 * via @PreAuthorize annotations.
 */
@RestController
@RequestMapping("/api/v1/assignments")
@Tag(name = "Assignments", description = "Assignment Management APIs for Teachers and Students")
@SecurityRequirement(name = "Bearer Authentication")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    // ============== TEACHER Endpoints ==============

    /**
     * POST /api/v1/assignments/create
     * Create a new assignment (TEACHER only)
     */
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/create")
    @Operation(summary = "Create a new assignment", description = "Create a new assignment with title, description, due date, type, and teams. "
            +
            "Only teachers can access this endpoint.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Assignment created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AssignmentSummaryDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data (validation error)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - teacher role required")
    })
    public ResponseEntity<AssignmentSummaryDto> createAssignment(
            @Valid @RequestBody CreateAssignmentRequest request,
            Authentication authentication) {

        Long creatorId = AuthUtil.extractUserId(authentication);
        AssignmentSummaryDto createdAssignment = assignmentService.createAssignment(request, creatorId);

        return new ResponseEntity<>(createdAssignment, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/assignments/{assignmentId}
     * Update an existing assignment (TEACHER only, must be creator)
     */
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{assignmentId}")
    @Operation(summary = "Update an assignment", description = "Update an existing assignment. Only the assignment creator can update it.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assignment updated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AssignmentSummaryDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not the assignment creator"),
            @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public ResponseEntity<AssignmentSummaryDto> updateAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateAssignmentRequest request,
            Authentication authentication) {

        Long creatorId = AuthUtil.extractUserId(authentication);
        AssignmentSummaryDto updatedAssignment = assignmentService.updateAssignment(assignmentId, request, creatorId);

        return new ResponseEntity<>(updatedAssignment, HttpStatus.OK);
    }

    /**
     * GET /api/v1/assignments/my-assignments
     * Get all assignments created by the current teacher (with pagination)
     */
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/my-assignments")
    @Operation(summary = "Get my assignments", description = "Retrieve all assignments created by the current teacher with pagination support. "
            +
            "Includes metadata like submission counts and grade progress.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assignments retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - teacher role required")
    })
    public ResponseEntity<Page<AssignmentTeacherViewDto>> getMyAssignments(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            Authentication authentication) {

        Long creatorId = AuthUtil.extractUserId(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<AssignmentTeacherViewDto> assignments = assignmentService.getMyAssignments(creatorId, pageable);

        return new ResponseEntity<>(assignments, HttpStatus.OK);
    }

    /**
     * DELETE /api/v1/assignments/{assignmentId}/archive
     * Archive an assignment (TEACHER only, must be creator)
     */
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{assignmentId}/archive")
    @Operation(summary = "Archive an assignment", description = "Archive an assignment (soft delete). Existing submissions and grades are preserved. "
            +
            "Only the assignment creator can archive it.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Assignment archived successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not the assignment creator"),
            @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public ResponseEntity<Void> archiveAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            Authentication authentication) {

        Long creatorId = AuthUtil.extractUserId(authentication);
        assignmentService.archiveAssignment(assignmentId, creatorId);

        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // ============== STUDENT Endpoints ==============

    /**
     * GET /api/v1/assignments/team/{teamId}
     * Get all assignments assigned to a specific team (with pagination)
     * STUDENT can view assignments for their team.
     */
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/team/{teamId}")
    @Operation(summary = "Get assignments for a team", description = "Retrieve all assignments assigned to a specific team with pagination. "
            +
            "Students can view assignments for their team.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assignments retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - student role required")
    })
    public ResponseEntity<Page<AssignmentSummaryDto>> getAssignmentsByTeam(
            @Parameter(description = "Team ID") @PathVariable Long teamId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "dueDate") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        Page<AssignmentSummaryDto> assignments = assignmentService.getAssignmentsByTeam(teamId, pageable);

        return new ResponseEntity<>(assignments, HttpStatus.OK);
    }

    /**
     * GET /api/v1/assignments/{assignmentId}
     * Get detailed information about an assignment (STUDENT can view to do the
     * assignment)
     */
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/{assignmentId}")
    @Operation(summary = "Get assignment details", description = "Retrieve detailed information about an assignment including questions and answer options. "
            +
            "Correct answers are not exposed (security measure). Available for students to view before doing the assignment.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assignment details retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AssignmentDetailDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - student role required"),
            @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public ResponseEntity<AssignmentDetailDto> getAssignmentDetail(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {

        AssignmentDetailDto assignmentDetail = assignmentService.getAssignmentDetail(assignmentId);

        return new ResponseEntity<>(assignmentDetail, HttpStatus.OK);
    }
}
