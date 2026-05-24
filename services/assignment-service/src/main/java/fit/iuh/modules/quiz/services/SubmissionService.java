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

    /**
     * Get details of a submission for teacher grading/review (TEACHER only)
     * Teacher must be the creator of the assignment.
     * 
     * @param submissionId The submission ID
     * @param creatorId    The teacher's account ID (for authorization check)
     * @return The submission details including questions, student answers, and grade
     */
    ViewSubmissionDto getSubmissionDetailForTeacher(Long submissionId, Long creatorId);

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

    // ============== NEW: Attempt History & Quiz Limits ==============

    /**
     * Get attempt history for a STUDENT on a SPECIFIC ASSIGNMENT (STUDENT only)
     * 
     * Shows all previous attempts with scores, dates, and status.
     * Used for displaying attempt table on assignment details.
     * 
     * Security: Student can only view their own attempt history.
     * 
     * @param assignmentId     The assignment ID
     * @param studentAccountId The student's account ID (for authorization check)
     * @return List of AttemptHistoryDto sorted by date (newest first)
     */
    java.util.List<AttemptHistoryDto> getAttemptHistory(Long assignmentId, Long studentAccountId);

    /**
     * Check if STUDENT can attempt a QUIZ again (validate maxAttempts)
     * 
     * Returns false if:
     * - Assignment type is QUIZ AND maxAttempts is set AND
     * - Student has already completed maxAttempts attempts
     * 
     * Security: Teacher can call this for supervision, Student for self-check
     * 
     * @param assignmentId     The assignment ID
     * @param studentAccountId The student's account ID
     * @return true if student can still attempt, false if limit reached
     */
    boolean canAttemptAssignment(Long assignmentId, Long studentAccountId);

    /**
     * Get remaining attempts for a QUIZ (null/unlimited returns -1)
     * 
     * @param assignmentId     The assignment ID
     * @param studentAccountId The student's account ID
     * @return Number of remaining attempts, or -1 if unlimited
     */
    int getRemainingAttempts(Long assignmentId, Long studentAccountId);

    /**
     * Start an assignment by creating a new DRAFT submission (STUDENT only)
     * 
     * Creates a new submission record for the student on the given assignment.
     * Required before submitting essay or quiz assignments.
     * 
     * @param assignmentId     The assignment ID
     * @param studentAccountId The student's account ID
     */
    void startAssignment(Long assignmentId, Long studentAccountId);

    /**
     * Get the current submission for an assignment (STUDENT only)
     * 
     * Returns the active DRAFT or SUBMITTED submission if one exists.
     * Returns null if no submission found.
     * 
     * @param assignmentId     The assignment ID
     * @param studentAccountId The student's account ID
     * @return The current submission, or null if none found
     */
    ViewSubmissionDto getCurrentSubmission(Long assignmentId, Long studentAccountId);
}
