package submission.controllers;

import submission.dto.SubmissionRequestDTO;
import submission.dto.SubmissionResponseDTO;
import submission.services.SubmissionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<SubmissionResponseDTO> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestBody SubmissionRequestDTO submissionDto) {
        log.info("Received submission request for assignment: {}", assignmentId);

        Long studentId = 1L;

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
     * Lấy chi tiết bài nộp theo ID
     * 
     * @param submissionId ID của Submission
     * @return ResponseEntity với SubmissionResponseDTO
     */
    @GetMapping("/{submissionId}")
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
     * Lấy tất cả bài nộp của một Assignment
     * 
     * Query: /api/assignments/{assignmentId}/submissions
     * 
     * @param assignmentId ID của Assignment
     * @return ResponseEntity với List của SubmissionResponseDTO
     */
    @GetMapping("/assignments/{assignmentId}")
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
     * Lấy tất cả bài nộp của sinh viên hiện tại (từ JWT Token)
     * 
     * @return ResponseEntity với List của SubmissionResponseDTO
     */
    @GetMapping("/my-submissions")
    public ResponseEntity<List<SubmissionResponseDTO>> getMySubmissions() {
        Long studentId = 1L;

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
     * Lấy bài nộp của sinh viên hiện tại cho một Assignment cụ thể
     * 
     * @param assignmentId ID của Assignment
     * @return ResponseEntity với SubmissionResponseDTO
     */
    @GetMapping("/assignments/{assignmentId}/my-submission")
    public ResponseEntity<SubmissionResponseDTO> getMySubmissionForAssignment(
            @PathVariable Long assignmentId) {
        Long studentId = 1L;

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

}
