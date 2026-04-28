package fit.iuh.common.exceptions;

/**
 * Exception thrown when a user attempts to access a resource they don't have
 * permission for.
 * 
 * Used for:
 * - Teacher trying to grade another teacher's assignment
 * - Student trying to view another student's submission
 * - Teacher trying to update another teacher's assignment
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }

    public AccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }

    public static AccessDeniedException notAssignmentCreator(Long teacherId, Long assignmentId) {
        return new AccessDeniedException(
                "Teacher with id " + teacherId + " is not the creator of assignment " + assignmentId);
    }

    public static AccessDeniedException notSubmissionOwner(Long studentId, Long submissionId) {
        return new AccessDeniedException(
                "Student with id " + studentId + " does not own submission " + submissionId);
    }
}
