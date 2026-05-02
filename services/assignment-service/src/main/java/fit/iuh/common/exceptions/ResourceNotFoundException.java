package fit.iuh.common.exceptions;

/**
 * Exception thrown when a requested resource is not found.
 * 
 * Used for:
 * - Assignment not found
 * - Submission not found
 * - Grade not found
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ResourceNotFoundException assignmentNotFound(Long id) {
        return new ResourceNotFoundException("Assignment not found with id: " + id);
    }

    public static ResourceNotFoundException submissionNotFound(Long id) {
        return new ResourceNotFoundException("Submission not found with id: " + id);
    }

    public static ResourceNotFoundException gradeNotFound(Long submissionId) {
        return new ResourceNotFoundException("Grade not found for submission id: " + submissionId);
    }
}
