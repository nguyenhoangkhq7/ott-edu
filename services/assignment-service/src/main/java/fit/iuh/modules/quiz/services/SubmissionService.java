package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Submission operations
 * 
 * Handles TEACHER and STUDENT operations related to submissions:
 * - TEACHER: View submissions for grading, grade submissions, add feedback
 * - STUDENT: View their own submissions, view grades
 */
public interface SubmissionService {

    // ============== TEACHER Operations ==============

    /**
     * Get all submissions for an assignment pending grade (TEACHER only, with
     * pagination)
     * Only the assignment creator can access this.
     * 
     * @param assignmentId The assignment ID
     * @param creatorId    The teacher's account ID (for authorization check)
     * @param pageable     Pagination info
     * @return Page of submissions pending grading
     */
    Page<SubmissionGradingListDto> getPendingGradesForAssignment(Long assignmentId, Long creatorId, Pageable pageable);

    /**
     * Get all submissions for an assignment (TEACHER only, with pagination)
     * Only the assignment creator can access this.
     * 
     * @param assignmentId The assignment ID
     * @param creatorId    The teacher's account ID (for authorization check)
     * @param pageable     Pagination info
     * @return Page of all submissions for the assignment
     */
    Page<SubmissionGradingListDto> getSubmissionsForAssignment(Long assignmentId, Long creatorId, Pageable pageable);

    /**
     * Grade a submission (TEACHER only)
     * Teacher must be the creator of the assignment the submission belongs to.
     * 
     * @param submissionId The submission ID to grade
     * @param request      The grading request with score and feedback
     * @param graderId     The teacher's account ID
     * @return The graded submission details
     */
    GradeDetailsDto gradeSubmission(Long submissionId, GradeSubmissionRequest request, Long graderId);

    // ============== STUDENT Operations ==============

    /**
     * Get a student's submission for a specific assignment (STUDENT only)
     * A student can only view their own submission.
     * 
     * @param submissionId     The submission ID
     * @param studentAccountId The student's account ID (for authorization check)
     * @return The student's submission details including answers and grade
     */
    ViewSubmissionDto getMySubmission(Long submissionId, Long studentAccountId);

    /**
     * Get a student's grade and feedback for a submission (STUDENT only)
     * A student can only view their own grade.
     * 
     * @param submissionId     The submission ID
     * @param studentAccountId The student's account ID (for authorization check)
     * @return The grade and feedback (if available)
     */
    GradeDetailsDto getMyGrade(Long submissionId, Long studentAccountId);

    /**
     * Get all submissions by a student (STUDENT only, with pagination)
     * 
     * @param studentAccountId The student's account ID
     * @param pageable         Pagination info
     * @return Page of student's submissions
     */
    Page<ViewSubmissionDto> getMySubmissions(Long studentAccountId, Pageable pageable);

    /**
     * Save draft answers while student is doing assignment (STUDENT only)
     * Updates existing DRAFT submission with partial answers.
     * Does NOT submit the assignment - just saves progress for auto-save
     * functionality.
     * 
     * @param submissionId     The submission ID to update
     * @param request          The draft save request with answers
     * @param studentAccountId The student's account ID (for authorization)
     */
    void saveDraft(Long submissionId, SaveDraftRequest request, Long studentAccountId);

    /**
     * Submit assignment for grading (STUDENT only)
     * Changes submission status from DRAFT to SUBMITTED.
     * Validates deadline - throws ValidationException if past due date.
     * Triggers auto-grading if applicable.
     * 
     * @param assignmentId     The assignment ID to submit
     * @param request          The submission request with final answers
     * @param studentAccountId The student's account ID (for authorization)
     */
    void submitAssignment(Long assignmentId, SubmitAssignmentRequest request, Long studentAccountId);
}
