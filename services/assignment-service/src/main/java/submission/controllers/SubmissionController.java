package submission.controllers;

import create_assignment.config.UserAuthenticationFilter;
import submission.dto.SubmissionRequestDTO;
import submission.dto.SubmissionResponseDTO;
import submission.services.SubmissionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

/**
 * Controller: SubmissionController
 * Quản lý API endpoints liên quan đến bài nộp/submission
 * 
 * Endpoints:
 * - POST /api/assignments/{assignmentId}/submissions : Nộp bài
 * - GET /api/submissions/{submissionId} : Lấy chi tiết bài nộp
 * - GET /api/assignments/{assignmentId}/submissions : Lấy tất cả bài nộp của
 * assignment
 * - GET /api/submissions/student : Lấy tất cả bài nộp của sinh viên hiện tại
 */
@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Slf4j
public class SubmissionController {

    private final SubmissionService submissionService;

    /**
     * POST /api/assignments/{assignmentId}/submissions
     * 
     * Nộp bài tập (ESSAY hoặc QUIZ)
     * 
     * Request Body:
     * {
     * "content": "Nội dung bài nộp (cho ESSAY)",
     * "materialIds": [1, 2, 3], // IDs của file đính kèm
     * "answers": [ // Danh sách câu trả lời (cho QUIZ)
     * {
     * "questionId": 1,
     * "selectedOptionId": 5
     * },
     * {
     * "questionId": 2,
     * "selectedOptionId": 9
     * }
     * ]
     * }
     * 
     * Response: 201 Created
     * {
     * "id": 1,
     * "assignmentId": 10,
     * "studentId": 5, // Lấy từ JWT Token
     * "content": "...",
     * "score": 8.5, // Tính tự động cho QUIZ
     * "status": "SUBMITTED",
     * "isLate": false,
     * "submittedAt": "2025-01-15T14:30:00",
     * ...
     * }
     * 
     * @param assignmentId  ID của bài tập
     * @param submissionDto SubmissionRequestDTO
     * @return ResponseEntity với SubmissionResponseDTO
     */
    @PostMapping("/assignments/{assignmentId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionResponseDTO> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestBody SubmissionRequestDTO submissionDto,
            Authentication authentication) {
        log.info("Received submission request for assignment: {}", assignmentId);

        Long studentId = extractUserIdFromAuthentication(authentication);

        try {
            // Gọi service để xử lý submission
            SubmissionResponseDTO response = submissionService.submitAssignment(
                    assignmentId,
                    studentId,
                    submissionDto);

            log.info("Submission successful for student: {} on assignment: {}", studentId, assignmentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error processing submission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/submissions/{submissionId}
     * 
     * Lấy chi tiết bài nộp theo ID (STUDENT hoặc TEACHER)
     * 
     * @param submissionId ID của Submission
     * @return ResponseEntity với SubmissionResponseDTO
     */
    @GetMapping("/{submissionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'STUDENT')")
    public ResponseEntity<SubmissionResponseDTO> getSubmissionById(
            @PathVariable Long submissionId) {
        try {
            SubmissionResponseDTO response = submissionService.getSubmissionById(submissionId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Submission not found: {}", submissionId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/assignments/{assignmentId}/submissions
     * 
     * Lấy tất cả bài nộp của một Assignment (TEACHER only)
     * 
     * Query: /api/assignments/{assignmentId}/submissions
     * 
     * @param assignmentId ID của Assignment
     * @return ResponseEntity với List của SubmissionResponseDTO
     */
    @GetMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<SubmissionResponseDTO>> getSubmissionsByAssignment(
            @PathVariable Long assignmentId) {
        try {
            List<SubmissionResponseDTO> response = submissionService.getSubmissionsByAssignment(assignmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching submissions for assignment: {}", assignmentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/submissions/my-submissions
     * 
     * Lấy tất cả bài nộp của sinh viên hiện tại (STUDENT only)
     * 
     * @return ResponseEntity với List của SubmissionResponseDTO
     */
    @GetMapping("/my-submissions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SubmissionResponseDTO>> getMySubmissions(Authentication authentication) {
        Long studentId = extractUserIdFromAuthentication(authentication);

        try {
            List<SubmissionResponseDTO> response = submissionService.getSubmissionsByStudent(studentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching submissions for student: {}", studentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/assignments/{assignmentId}/submissions/me
     * 
     * Lấy bài nộp của sinh viên hiện tại cho một Assignment cụ thể (STUDENT only)
     * 
     * @param assignmentId ID của Assignment
     * @return ResponseEntity với SubmissionResponseDTO
     */
    @GetMapping("/assignments/{assignmentId}/my-submission")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionResponseDTO> getMySubmissionForAssignment(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        Long studentId = extractUserIdFromAuthentication(authentication);

        try {
            Optional<SubmissionResponseDTO> response = submissionService
                    .getSubmissionByAssignmentAndStudent(assignmentId, studentId);

            if (response.isPresent()) {
                return ResponseEntity.ok(response.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching submission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
