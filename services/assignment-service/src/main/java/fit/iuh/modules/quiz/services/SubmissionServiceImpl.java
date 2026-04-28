package fit.iuh.modules.quiz.services;

import fit.iuh.common.exceptions.AccessDeniedException;
import fit.iuh.common.exceptions.ResourceNotFoundException;
import fit.iuh.common.exceptions.ValidationException;
import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.models.Grade;
import fit.iuh.modules.quiz.models.Submission;
import fit.iuh.modules.quiz.models.SubmissionStatus;
import fit.iuh.modules.quiz.repositories.AssignmentRepository;
import fit.iuh.modules.quiz.repositories.GradeRepository;
import fit.iuh.modules.quiz.repositories.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Implementation of SubmissionService
 *
 * Handles TEACHER and STUDENT operations for submissions with strict RBAC
 * enforcement.
 */
@Service
@Transactional
public class SubmissionServiceImpl implements SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    // ============== TEACHER Operations ==============

    @Override
    public Page<SubmissionGradingListDto> getPendingGradesForAssignment(Long assignmentId, Long creatorId,
                                                                        Pageable pageable) {
        // Verify teacher is the creator of this assignment
        var assignment = assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)
                .orElseThrow(() -> {
                    var existing = assignmentRepository.findById(assignmentId).orElse(null);
                    if (existing != null && !existing.getCreatorId().equals(creatorId)) {
                        return AccessDeniedException.notAssignmentCreator(creatorId, assignmentId);
                    }
                    return ResourceNotFoundException.assignmentNotFound(assignmentId);
                });

        Page<Submission> submissions = submissionRepository.findPendingGradesByAssignmentId(assignmentId, pageable);
        return submissions.map(this::toGradingListDto);
    }

    @Override
    public Page<SubmissionGradingListDto> getSubmissionsForAssignment(Long assignmentId, Long creatorId,
                                                                      Pageable pageable) {
        // Verify teacher is the creator of this assignment
        var assignment = assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)
                .orElseThrow(() -> {
                    var existing = assignmentRepository.findById(assignmentId).orElse(null);
                    if (existing != null && !existing.getCreatorId().equals(creatorId)) {
                        return AccessDeniedException.notAssignmentCreator(creatorId, assignmentId);
                    }
                    return ResourceNotFoundException.assignmentNotFound(assignmentId);
                });

        Page<Submission> submissions = submissionRepository.findByAssignmentId(assignmentId, pageable);
        return submissions.map(this::toGradingListDto);
    }

    @Override
    public GradeDetailsDto gradeSubmission(Long submissionId, GradeSubmissionRequest request, Long graderId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> ResourceNotFoundException.submissionNotFound(submissionId));

        // Verify teacher is the creator of the assignment
        var assignment = assignmentRepository.findByIdAndCreatorId(submission.getAssignment().getId(), graderId)
                .orElseThrow(
                        () -> AccessDeniedException.notAssignmentCreator(graderId, submission.getAssignment().getId()));

        // Validate score doesn't exceed max score
        if (request.getScore() > assignment.getMaxScore()) {
            throw ValidationException.scoreExceedsMaxScore(request.getScore(), assignment.getMaxScore());
        }

        // Get the next revision number
        Integer maxRevision = gradeRepository.findMaxRevisionBySubmissionId(submissionId);
        Integer nextRevision = (maxRevision != null) ? maxRevision + 1 : 1;

        // Create or update grade
        Grade grade = gradeRepository.findBySubmissionId(submissionId)
                .orElse(new Grade());

        grade.setSubmission(submission);
        grade.setScore(request.getScore());
        grade.setFeedback(request.getFeedback());
        grade.setGradedAt(LocalDateTime.now());
        grade.setGradedBy(graderId);
        grade.setRevision(nextRevision);

        Grade savedGrade = gradeRepository.save(grade);
        submission.setGrade(savedGrade);
        submissionRepository.save(submission);

        return toGradeDetailsDto(savedGrade);
    }

    // ============== STUDENT Operations ==============

    @Override
    public ViewSubmissionDto getMySubmission(Long submissionId, Long studentAccountId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> ResourceNotFoundException.submissionNotFound(submissionId));

        // Verify student owns this submission
        if (!submission.getAccountId().equals(studentAccountId)) {
            throw AccessDeniedException.notSubmissionOwner(studentAccountId, submissionId);
        }

        return toViewSubmissionDto(submission);
    }

    @Override
    public GradeDetailsDto getMyGrade(Long submissionId, Long studentAccountId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> ResourceNotFoundException.submissionNotFound(submissionId));

        // Verify student owns this submission
        if (!submission.getAccountId().equals(studentAccountId)) {
            throw AccessDeniedException.notSubmissionOwner(studentAccountId, submissionId);
        }

        Grade grade = submission.getGrade();
        if (grade == null) {
            throw ResourceNotFoundException.gradeNotFound(submissionId);
        }

        return toGradeDetailsDto(grade);
    }

    @Override
    public Page<ViewSubmissionDto> getMySubmissions(Long studentAccountId, Pageable pageable) {
        Page<Submission> submissions = submissionRepository.findByAccountId(studentAccountId, pageable);
        return submissions.map(this::toViewSubmissionDto);
    }

    // ============== Helper Methods ==============

    /**
     * Convert Submission entity to grading list DTO (for teacher grading queue)
     */
    private SubmissionGradingListDto toGradingListDto(Submission submission) {
        SubmissionGradingListDto dto = new SubmissionGradingListDto();
        dto.setSubmissionId(submission.getId());
        dto.setStudentAccountId(submission.getAccountId());
        dto.setAssignmentId(submission.getAssignment().getId());
        dto.setStatus(submission.getStatus());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setLate(submission.isLate());

        if (submission.getGrade() != null) {
            dto.setGraded(true);
            dto.setCurrentScore(submission.getGrade().getScore());
            dto.setGradeRevision(submission.getGrade().getRevision());
        } else {
            dto.setGraded(false);
        }

        return dto;
    }

    /**
     * Convert Submission entity to view DTO (for student viewing their submission)
     */
    private ViewSubmissionDto toViewSubmissionDto(Submission submission) {
        ViewSubmissionDto dto = new ViewSubmissionDto();
        dto.setId(submission.getId());
        dto.setSubmissionId(submission.getId());
        dto.setAssignmentId(submission.getAssignment().getId());
        dto.setAccountId(submission.getAccountId());
        dto.setStatus(submission.getStatus());
        dto.setCreatedAt(submission.getCreatedAt());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setLate(submission.isLate());

        // Assignment context
        dto.setAssignmentTitle(submission.getAssignment().getTitle());
        dto.setMaxScore(submission.getAssignment().getMaxScore());
        dto.setDueDate(submission.getAssignment().getDueDate());

        // Student's answers with earned points
        if (submission.getStudentAnswers() != null) {
            dto.setStudentAnswers(
                    submission.getStudentAnswers().stream()
                            .map(sa -> {
                                StudentAnswerWithPointsDto answerDto = new StudentAnswerWithPointsDto();
                                answerDto.setQuestionId(sa.getQuestion().getId());
                                answerDto.setQuestionContent(sa.getQuestion().getContent());
                                answerDto.setQuestionPoints(sa.getQuestion().getPoints());
                                answerDto.setQuestionType(sa.getQuestion().getType().name());
                                answerDto.setSelectedOptionIds(
                                        sa.getSelectedOptions().stream()
                                                .map(opt -> opt.getId())
                                                .collect(Collectors.toList()));
                                answerDto.setEarnedPoints(sa.getEarnedPoints());
                                return answerDto;
                            })
                            .collect(Collectors.toList()));
        }

        // Grade information (if graded)
        if (submission.getGrade() != null) {
            dto.setGrade(toGradeDetailsDto(submission.getGrade()));
        }

        return dto;
    }

    /**
     * Convert Grade entity to DTO (for both teacher and student viewing)
     * NOTE: Does NOT include gradedBy field (hidden from students)
     */
    private GradeDetailsDto toGradeDetailsDto(Grade grade) {
        GradeDetailsDto dto = new GradeDetailsDto();
        dto.setId(grade.getId());
        dto.setScore(grade.getScore());
        dto.setFeedback(grade.getFeedback());
        dto.setGradedAt(grade.getGradedAt());
        dto.setRevision(grade.getRevision());
        // DO NOT set gradedBy - hidden from students per security requirement

        return dto;
    }

    // ============== STUDENT Actions - Do Assignment & Submit ==============

    @Override
    public void saveDraft(Long submissionId, SaveDraftRequest request, Long studentAccountId) {
        // Load and verify ownership
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> ResourceNotFoundException.submissionNotFound(submissionId));

        if (!submission.getAccountId().equals(studentAccountId)) {
            throw AccessDeniedException.notSubmissionOwner(studentAccountId, submissionId);
        }

        // Only allow draft saving if status is still DRAFT
        if (submission.getStatus() != SubmissionStatus.DRAFT) {
            throw ValidationException.alreadySubmitted(submissionId);
        }

        // Update answers (for QUIZ type)
        if (request.getQuestionAnswers() != null && !request.getQuestionAnswers().isEmpty()) {
            // Note: In a full implementation, integrate with StudentAnswer entity updates
            // For now, we acknowledge the answers are being saved
            // This would typically:
            // 1. Clear previous answers
            // 2. Create new StudentAnswer records for each question
            // 3. Link AnswerOptions that were selected
        }

        // Update essay content (for ESSAY type)
        if (request.getEssayContent() != null) {
            // In production, you'd store essay content in a dedicated field
            // or a separate EssayContent entity
        }

        // Update file URL if provided
        if (request.getFileUrl() != null) {
            // Store file URL for reference (optional file uploads)
        }

        // Keep status as DRAFT - not submitting yet
        submission.setUpdatedAt(LocalDateTime.now());
        submissionRepository.save(submission);
    }

    @Override
    public void submitAssignment(Long assignmentId, SubmitAssignmentRequest request, Long studentAccountId) {
        // Verify confirmation
        if (!Boolean.TRUE.equals(request.getConfirm())) {
            throw ValidationException.submissionNotConfirmed();
        }

        // Load assignment and check deadline
        var assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> ResourceNotFoundException.assignmentNotFound(assignmentId));

        // Find the student's active submission for this assignment
        Submission submission = submissionRepository.findByAccountIdAndAssignmentId(studentAccountId, assignmentId)
                .orElseThrow(() -> new ValidationException("Submission not found. Start the assignment first."));

        // Verify student owns this submission
        if (!submission.getAccountId().equals(studentAccountId)) {
            throw AccessDeniedException.notSubmissionOwner(studentAccountId, submission.getId());
        }

        // Only allow submission if status is still DRAFT
        if (submission.getStatus() != SubmissionStatus.DRAFT) {
            throw ValidationException.alreadySubmitted(submission.getId());
        }

        // Check deadline - mark as late if past due
        boolean isLate = assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate());
        if (isLate) {
            submission.setLate(true);
        }

        // Store final answers (for QUIZ type)
        if (request.getQuestionAnswers() != null && !request.getQuestionAnswers().isEmpty()) {
            // In a full implementation:
            // 1. Validate that all required questions are answered
            // 2. Create StudentAnswer records with final selections
            // 3. Run auto-grading if assignment type is AUTO_GRADE
            // 4. Calculate earned points
        }

        // Store essay content (for ESSAY type)
        if (request.getEssayContent() != null) {
            // Store final essay content
        }

        // Store file URL if provided
        if (request.getFileUrl() != null) {
            // Store submission file URL
        }

        // Mark as SUBMITTED
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setUpdatedAt(LocalDateTime.now());

        submissionRepository.save(submission);

        // Trigger auto-grading if applicable
        // In production, this might:
        // - Call an auto-grading service
        // - Create a Grade record with calculated score
        // - For QUIZ with auto-grade: calculate score based on correct answers
        // - For ESSAY: just mark as pending manual grading
    }
}
