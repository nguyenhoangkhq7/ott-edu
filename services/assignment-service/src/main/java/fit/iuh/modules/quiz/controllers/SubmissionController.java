package fit.iuh.modules.quiz.controllers;

import fit.iuh.common.utils.AuthUtil;
import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.services.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Parameter;
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

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for Submission and Grading management.
 * 
 * Handles both TEACHER and STUDENT operations:
 * - TEACHER: View submissions, grade submissions, provide feedback
 * - STUDENT: View their own submissions, view grades and feedback
 * 
 * All endpoints require authentication. Role-based access control is enforced
 * via @PreAuthorize annotations. Data access is further restricted by ownership
 * checks
 * in the Service layer.
 */
@RestController
@RequestMapping("/api/v1/submissions")
@Tag(name = "Submissions & Grading", description = "Submission and Grading APIs for Teachers and Students")
@SecurityRequirement(name = "Bearer Authentication")
public class SubmissionController {

        @Autowired
        private SubmissionService submissionService;

        // ============== TEACHER Endpoints ==============

        /**
         * GET /api/v1/submissions/assignment/{assignmentId}/pending
         * Get submissions pending grading for an assignment (TEACHER only, must be
         * creator)
         */
        @PreAuthorize("hasRole('TEACHER')")
        @GetMapping("/assignment/{assignmentId}/pending")
        @Operation(summary = "Get pending submissions for grading", description = "Retrieve all submissions pending grading for a specific assignment. "
                        +
                        "Only the assignment creator can access this. Returned data is minimal (only accountId) " +
                        "to maintain microservices boundary.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Pending submissions retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - not the assignment creator"),
                        @ApiResponse(responseCode = "404", description = "Assignment not found")
        })
        public ResponseEntity<Page<SubmissionGradingListDto>> getPendingGrading(
                        @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
                        @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {

                Long creatorId = AuthUtil.extractUserId(authentication);
                Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
                Page<SubmissionGradingListDto> submissions = submissionService
                                .getPendingGradesForAssignment(assignmentId, creatorId, pageable);

                return new ResponseEntity<>(submissions, HttpStatus.OK);
        }

        /**
         * GET /api/v1/submissions/assignment/{assignmentId}
         * Get all submissions for an assignment (TEACHER only, must be creator)
         */
        @PreAuthorize("hasRole('TEACHER')")
        @GetMapping("/assignment/{assignmentId}")
        @Operation(summary = "Get all submissions for an assignment", description = "Retrieve all submissions (graded and pending) for a specific assignment with pagination. "
                        +
                        "Only the assignment creator can access this.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Submissions retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - not the assignment creator"),
                        @ApiResponse(responseCode = "404", description = "Assignment not found")
        })
        public ResponseEntity<Page<SubmissionGradingListDto>> getSubmissions(
                        @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
                        @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {

                Long creatorId = AuthUtil.extractUserId(authentication);
                Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
                Page<SubmissionGradingListDto> submissions = submissionService
                                .getSubmissionsForAssignment(assignmentId, creatorId, pageable);

                return new ResponseEntity<>(submissions, HttpStatus.OK);
        }

        /**
         * POST /api/v1/submissions/{submissionId}/grade
         * Grade a submission (TEACHER only, must be assignment creator)
         */
        @PreAuthorize("hasRole('TEACHER')")
        @PostMapping("/{submissionId}/grade")
        @Operation(summary = "Grade a submission", description = "Submit a grade and feedback for a student's submission. "
                        +
                        "Only the creator of the assignment can grade submissions. " +
                        "Supports re-grading with automatic revision tracking.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Submission graded successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = GradeDetailsDto.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid grade data (e.g., score exceeds max score)"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - not the assignment creator"),
                        @ApiResponse(responseCode = "404", description = "Submission not found")
        })
        public ResponseEntity<GradeDetailsDto> gradeSubmission(
                        @Parameter(description = "Submission ID") @PathVariable Long submissionId,
                        @Valid @RequestBody GradeSubmissionRequest request,
                        Authentication authentication) {

                Long graderId = AuthUtil.extractUserId(authentication);
                GradeDetailsDto grade = submissionService.gradeSubmission(submissionId, request, graderId);

                return new ResponseEntity<>(grade, HttpStatus.OK);
        }

        // ============== STUDENT Endpoints ==============

        /**
         * GET /api/v1/submissions/{submissionId}
         * Get a student's own submission (STUDENT only, owner verification)
         */
        @PreAuthorize("hasRole('STUDENT')")
        @GetMapping("/{submissionId}")
        @Operation(summary = "Get my submission", description = "Retrieve details of a student's own submission including questions answered and earned points. "
                        +
                        "Students can only view their own submissions.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Submission retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ViewSubmissionDto.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - not the submission owner"),
                        @ApiResponse(responseCode = "404", description = "Submission not found")
        })
        public ResponseEntity<ViewSubmissionDto> getMySubmission(
                        @Parameter(description = "Submission ID") @PathVariable Long submissionId,
                        Authentication authentication) {

                Long studentAccountId = AuthUtil.extractUserId(authentication);
                ViewSubmissionDto submission = submissionService.getMySubmission(submissionId, studentAccountId);

                return new ResponseEntity<>(submission, HttpStatus.OK);
        }

        /**
         * GET /api/v1/submissions/{submissionId}/grade
         * Get a student's grade and feedback (STUDENT only, owner verification)
         */
        @PreAuthorize("hasRole('STUDENT')")
        @GetMapping("/{submissionId}/grade")
        @Operation(summary = "Get my grade", description = "Retrieve the grade and feedback for a student's submission. "
                        +
                        "Students can only view their own grades.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Grade retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = GradeDetailsDto.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - not the submission owner"),
                        @ApiResponse(responseCode = "404", description = "Grade not found or submission not graded yet")
        })
        public ResponseEntity<GradeDetailsDto> getMyGrade(
                        @Parameter(description = "Submission ID") @PathVariable Long submissionId,
                        Authentication authentication) {

                Long studentAccountId = AuthUtil.extractUserId(authentication);
                GradeDetailsDto grade = submissionService.getMyGrade(submissionId, studentAccountId);

                return new ResponseEntity<>(grade, HttpStatus.OK);
        }

        /**
         * GET /api/v1/submissions/my-submissions
         * Get all submissions by the current student (with pagination)
         */
        @PreAuthorize("hasRole('STUDENT')")
        @GetMapping("/my-submissions")
        @Operation(summary = "Get my submission history", description = "Retrieve all submissions made by the current student with pagination. "
                        +
                        "Includes submission details, answers, and grades if available.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Submissions retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - student role required")
        })
        public ResponseEntity<Page<ViewSubmissionDto>> getMySubmissions(
                        @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {

                Long studentAccountId = AuthUtil.extractUserId(authentication);
                Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
                Page<ViewSubmissionDto> submissions = submissionService.getMySubmissions(studentAccountId, pageable);

                return new ResponseEntity<>(submissions, HttpStatus.OK);
        }

        /**
         * POST /api/v1/submissions/{submissionId}/save-draft
         * Save draft answers for a submission (STUDENT only, owner verification)
         */
        @PreAuthorize("hasRole('STUDENT')")
        @PostMapping("/{submissionId}/save-draft")
        @Operation(summary = "Save draft answers", description = "Auto-save student's progress on an assignment. " +
                        "Keeps submission in DRAFT status. Students can only save their own submissions.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Draft saved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request data"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - not the submission owner"),
                        @ApiResponse(responseCode = "404", description = "Submission not found")
        })
        public ResponseEntity<Map<String, String>> saveDraft(
                        @Parameter(description = "Submission ID") @PathVariable Long submissionId,
                        @Valid @RequestBody SaveDraftRequest request,
                        Authentication authentication) {

                Long studentAccountId = AuthUtil.extractUserId(authentication);
                submissionService.saveDraft(submissionId, request, studentAccountId);

                Map<String, String> response = new HashMap<>();
                response.put("message", "Draft saved successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
        }

        /**
         * POST /api/v1/submissions/assignment/{assignmentId}/submit
         * Submit an assignment for grading (STUDENT only)
         */
        @PreAuthorize("hasRole('STUDENT')")
        @PostMapping("/assignment/{assignmentId}/submit")
        @Operation(summary = "Submit assignment", description = "Submit completed assignment for grading. " +
                        "Validates that assignment deadline has not passed. Transitions submission from DRAFT to SUBMITTED status. "
                        +
                        "Triggers auto-grading if applicable.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Assignment submitted successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Map.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid request or deadline has passed"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - student role required"),
                        @ApiResponse(responseCode = "404", description = "Assignment or submission not found")
        })
        public ResponseEntity<Map<String, Object>> submitAssignment(
                        @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
                        @Valid @RequestBody SubmitAssignmentRequest request,
                        Authentication authentication) {

                Long studentAccountId = AuthUtil.extractUserId(authentication);
                submissionService.submitAssignment(assignmentId, request, studentAccountId);

                Map<String, Object> response = new HashMap<>();
                response.put("message", "Assignment submitted successfully");
                response.put("submittedAt", java.time.LocalDateTime.now());
                return new ResponseEntity<>(response, HttpStatus.OK);
        }
}
