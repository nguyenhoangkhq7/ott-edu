package fit.iuh.common.exceptions;

/**
 * Exception thrown when business logic validation fails.
 * 
 * Used for:
 * - Student trying to submit after due date
 * - Score exceeding max score of assignment
 * - Grading an already submitted assignment
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ValidationException submissionDeadlinePassed(Long assignmentId) {
        return new ValidationException(
                "Cannot submit assignment " + assignmentId + " as the due date has passed");
    }

    public static ValidationException scoreExceedsMaxScore(Double score, Double maxScore) {
        return new ValidationException(
                "Score " + score + " exceeds maximum score " + maxScore);
    }

    public static ValidationException alreadySubmitted(Long submissionId) {
        return new ValidationException(
                "Submission " + submissionId + " has already been submitted and cannot be modified");
    }

    public static ValidationException submissionNotConfirmed() {
        return new ValidationException(
                "Submission must be confirmed before submitting. Please confirm your submission intent.");
    }
}
