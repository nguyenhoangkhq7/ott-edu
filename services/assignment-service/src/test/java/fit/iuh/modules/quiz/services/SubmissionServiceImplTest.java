package fit.iuh.modules.quiz.services;

import fit.iuh.common.exceptions.AccessDeniedException;
import fit.iuh.common.exceptions.ResourceNotFoundException;
import fit.iuh.common.exceptions.ValidationException;
import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.models.*;
import fit.iuh.modules.quiz.repositories.AssignmentRepository;
import fit.iuh.modules.quiz.repositories.GradeRepository;
import fit.iuh.modules.quiz.repositories.SubmissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubmissionServiceImplTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private GradeRepository gradeRepository;

    @Mock
    private AssignmentRepository assignmentRepository;

    @Mock
    private CoreServiceClient coreServiceClient;

    @InjectMocks
    private SubmissionServiceImpl submissionService;

    // ==========================================
    // 1. getPendingGradesForAssignment
    // ==========================================

    @Test
    void getPendingGradesForAssignment_Success() {
        Long assignmentId = 1L;
        Long creatorId = 2L;
        Pageable pageable = PageRequest.of(0, 10);
        String authHeader = "Bearer token";

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setCreatorId(creatorId);

        Submission submission = new Submission();
        submission.setId(10L);
        submission.setAccountId(100L);
        submission.setAssignment(assignment);
        submission.setStatus(SubmissionStatus.SUBMITTED);

        Page<Submission> submissionsPage = new PageImpl<>(List.of(submission));

        ProfileResponseDto profileDto = new ProfileResponseDto();
        profileDto.setAccountId(100L);
        profileDto.setCode("STUDENT001");
        profileDto.setFullName("John Doe");

        when(assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findPendingGradesByAssignmentId(assignmentId, pageable)).thenReturn(submissionsPage);
        when(coreServiceClient.getProfilesByAccounts(List.of(100L), authHeader)).thenReturn(List.of(profileDto));

        Page<SubmissionGradingListDto> result = submissionService.getPendingGradesForAssignment(assignmentId, creatorId, pageable, authHeader);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("John Doe", result.getContent().get(0).getStudentName());
        assertEquals("STUDENT001", result.getContent().get(0).getStudentCode());
    }

    @Test
    void getPendingGradesForAssignment_Failure_NotCreator() {
        Long assignmentId = 1L;
        Long creatorId = 2L;
        Pageable pageable = PageRequest.of(0, 10);
        String authHeader = "Bearer token";

        Assignment existingAssignment = new Assignment();
        existingAssignment.setId(assignmentId);
        existingAssignment.setCreatorId(99L); // Different creator

        when(assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)).thenReturn(Optional.empty());
        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(existingAssignment));

        assertThrows(AccessDeniedException.class, () -> {
            submissionService.getPendingGradesForAssignment(assignmentId, creatorId, pageable, authHeader);
        });
    }

    // ==========================================
    // 2. getSubmissionsForAssignment
    // ==========================================

    @Test
    void getSubmissionsForAssignment_Success() {
        Long assignmentId = 1L;
        Long creatorId = 2L;
        Pageable pageable = PageRequest.of(0, 10);
        String authHeader = "Bearer token";

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setCreatorId(creatorId);

        Submission submission = new Submission();
        submission.setId(10L);
        submission.setAccountId(100L);
        submission.setAssignment(assignment);
        submission.setStatus(SubmissionStatus.SUBMITTED);

        Page<Submission> submissionsPage = new PageImpl<>(List.of(submission));

        ProfileResponseDto profileDto = new ProfileResponseDto();
        profileDto.setAccountId(100L);
        profileDto.setCode("STUDENT001");
        profileDto.setFullName("John Doe");

        when(assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAssignmentId(assignmentId, pageable)).thenReturn(submissionsPage);
        when(coreServiceClient.getProfilesByAccounts(List.of(100L), authHeader)).thenReturn(List.of(profileDto));

        Page<SubmissionGradingListDto> result = submissionService.getSubmissionsForAssignment(assignmentId, creatorId, pageable, authHeader);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("John Doe", result.getContent().get(0).getStudentName());
    }

    @Test
    void getSubmissionsForAssignment_Failure_NotFound() {
        Long assignmentId = 1L;
        Long creatorId = 2L;
        Pageable pageable = PageRequest.of(0, 10);
        String authHeader = "Bearer token";

        when(assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)).thenReturn(Optional.empty());
        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            submissionService.getSubmissionsForAssignment(assignmentId, creatorId, pageable, authHeader);
        });
    }

    // ==========================================
    // 3. gradeSubmission
    // ==========================================

    @Test
    void gradeSubmission_Success() {
        Long submissionId = 10L;
        Long graderId = 2L;
        GradeSubmissionRequest request = new GradeSubmissionRequest();
        request.setScore(8.5);
        request.setFeedback("Good work");

        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setMaxScore(10.0);
        assignment.setCreatorId(graderId);

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAssignment(assignment);
        submission.setStatus(SubmissionStatus.SUBMITTED);

        Grade existingGrade = new Grade();
        existingGrade.setId(20L);
        existingGrade.setSubmission(submission);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(assignmentRepository.findByIdAndCreatorId(1L, graderId)).thenReturn(Optional.of(assignment));
        when(gradeRepository.findMaxRevisionBySubmissionId(submissionId)).thenReturn(1);
        when(gradeRepository.findBySubmissionId(submissionId)).thenReturn(Optional.of(existingGrade));
        when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GradeDetailsDto result = submissionService.gradeSubmission(submissionId, request, graderId);

        assertNotNull(result);
        assertEquals(8.5, result.getScore());
        assertEquals("Good work", result.getFeedback());
        assertEquals(2, result.getRevision());
        assertEquals(SubmissionStatus.GRADED, submission.getStatus());
    }

    @Test
    void gradeSubmission_Failure_ScoreExceedsMax() {
        Long submissionId = 10L;
        Long graderId = 2L;
        GradeSubmissionRequest request = new GradeSubmissionRequest();
        request.setScore(12.0); // Exceeds max score

        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setMaxScore(10.0);
        assignment.setCreatorId(graderId);

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAssignment(assignment);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(assignmentRepository.findByIdAndCreatorId(1L, graderId)).thenReturn(Optional.of(assignment));

        assertThrows(ValidationException.class, () -> {
            submissionService.gradeSubmission(submissionId, request, graderId);
        });
    }

    // ==========================================
    // 4. getSubmissionDetailForTeacher
    // ==========================================

    @Test
    void getSubmissionDetailForTeacher_Success() {
        Long submissionId = 10L;
        Long creatorId = 2L;

        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setCreatorId(creatorId);
        assignment.setTitle("Test Title");

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAssignment(assignment);
        submission.setAccountId(100L);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        ViewSubmissionDto result = submissionService.getSubmissionDetailForTeacher(submissionId, creatorId);

        assertNotNull(result);
        assertEquals(submissionId, result.getSubmissionId());
        assertEquals("Test Title", result.getAssignmentTitle());
    }

    @Test
    void getSubmissionDetailForTeacher_Failure_AccessDenied() {
        Long submissionId = 10L;
        Long creatorId = 2L;

        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setCreatorId(99L); // Different creator

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAssignment(assignment);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        assertThrows(AccessDeniedException.class, () -> {
            submissionService.getSubmissionDetailForTeacher(submissionId, creatorId);
        });
    }

    // ==========================================
    // 5. getMySubmission
    // ==========================================

    @Test
    void getMySubmission_Success() {
        Long submissionId = 10L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(1L);

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAccountId(studentAccountId);
        submission.setAssignment(assignment);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        ViewSubmissionDto result = submissionService.getMySubmission(submissionId, studentAccountId);

        assertNotNull(result);
        assertEquals(submissionId, result.getId());
    }

    @Test
    void getMySubmission_Failure_NotOwner() {
        Long submissionId = 10L;
        Long studentAccountId = 100L;

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAccountId(999L); // Different student

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        assertThrows(AccessDeniedException.class, () -> {
            submissionService.getMySubmission(submissionId, studentAccountId);
        });
    }

    // ==========================================
    // 6. getMyGrade
    // ==========================================

    @Test
    void getMyGrade_Success() {
        Long submissionId = 10L;
        Long studentAccountId = 100L;

        Grade grade = new Grade();
        grade.setId(20L);
        grade.setScore(9.0);
        grade.setFeedback("Awesome!");

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAccountId(studentAccountId);
        submission.setGrade(grade);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        GradeDetailsDto result = submissionService.getMyGrade(submissionId, studentAccountId);

        assertNotNull(result);
        assertEquals(9.0, result.getScore());
        assertEquals("Awesome!", result.getFeedback());
    }

    @Test
    void getMyGrade_Failure_NoGrade() {
        Long submissionId = 10L;
        Long studentAccountId = 100L;

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAccountId(studentAccountId);
        submission.setGrade(null); // No grade yet

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        assertThrows(ResourceNotFoundException.class, () -> {
            submissionService.getMyGrade(submissionId, studentAccountId);
        });
    }

    // ==========================================
    // 7. getMySubmissions
    // ==========================================

    @Test
    void getMySubmissions_Success() {
        Long studentAccountId = 100L;
        Pageable pageable = PageRequest.of(0, 10);

        Assignment assignment = new Assignment();
        assignment.setId(1L);

        Submission submission = new Submission();
        submission.setId(10L);
        submission.setAccountId(studentAccountId);
        submission.setAssignment(assignment);

        Page<Submission> page = new PageImpl<>(List.of(submission));
        when(submissionRepository.findByAccountId(studentAccountId, pageable)).thenReturn(page);

        Page<ViewSubmissionDto> result = submissionService.getMySubmissions(studentAccountId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(10L, result.getContent().get(0).getId());
    }

    @Test
    void getMySubmissions_Empty() {
        Long studentAccountId = 100L;
        Pageable pageable = PageRequest.of(0, 10);

        when(submissionRepository.findByAccountId(studentAccountId, pageable)).thenReturn(Page.empty());

        Page<ViewSubmissionDto> result = submissionService.getMySubmissions(studentAccountId, pageable);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ==========================================
    // 8. saveDraft
    // ==========================================

    @Test
    void saveDraft_Success() {
        Long submissionId = 10L;
        Long studentAccountId = 100L;
        SaveDraftRequest request = new SaveDraftRequest();
        request.setEssayContent("Draft essay");

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAccountId(studentAccountId);
        submission.setStatus(SubmissionStatus.DRAFT);

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        assertDoesNotThrow(() -> {
            submissionService.saveDraft(submissionId, request, studentAccountId);
        });

        verify(submissionRepository, times(1)).save(submission);
    }

    @Test
    void saveDraft_Failure_AlreadySubmitted() {
        Long submissionId = 10L;
        Long studentAccountId = 100L;
        SaveDraftRequest request = new SaveDraftRequest();

        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setAccountId(studentAccountId);
        submission.setStatus(SubmissionStatus.SUBMITTED); // Already submitted

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        assertThrows(ValidationException.class, () -> {
            submissionService.saveDraft(submissionId, request, studentAccountId);
        });
    }

    // ==========================================
    // 9. submitAssignment
    // ==========================================

    @Test
    void submitAssignment_Success() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;
        SubmitAssignmentRequest request = new SubmitAssignmentRequest();
        request.setConfirm(true);
        request.setFileUrl("http://s3/file.pdf");

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setDueDate(LocalDateTime.now().plusDays(1)); // In the future

        Submission submission = new Submission();
        submission.setId(10L);
        submission.setAccountId(studentAccountId);
        submission.setStatus(SubmissionStatus.DRAFT);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAccountIdAndAssignmentId(studentAccountId, assignmentId)).thenReturn(Optional.of(submission));

        assertDoesNotThrow(() -> {
            submissionService.submitAssignment(assignmentId, request, studentAccountId);
        });

        assertEquals(SubmissionStatus.SUBMITTED, submission.getStatus());
        assertEquals("http://s3/file.pdf", submission.getFileUrl());
        assertFalse(submission.isLate());
        verify(submissionRepository, times(1)).save(submission);
    }

    @Test
    void submitAssignment_Failure_NotConfirmed() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;
        SubmitAssignmentRequest request = new SubmitAssignmentRequest();
        request.setConfirm(false); // Not confirmed

        assertThrows(ValidationException.class, () -> {
            submissionService.submitAssignment(assignmentId, request, studentAccountId);
        });
    }

    // ==========================================
    // 10. getAttemptHistory
    // ==========================================

    @Test
    void getAttemptHistory_Success() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setMaxScore(10.0);

        Submission submission1 = new Submission();
        submission1.setId(10L);
        submission1.setStatus(SubmissionStatus.SUBMITTED);

        Submission submission2 = new Submission();
        submission2.setId(11L);
        submission2.setStatus(SubmissionStatus.GRADED);
        Grade grade = new Grade();
        grade.setScore(8.0);
        grade.setFeedback("Nice");
        submission2.setGrade(grade);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findAttemptHistoryByAccountAndAssignment(studentAccountId, assignmentId))
                .thenReturn(List.of(submission2, submission1));

        List<AttemptHistoryDto> history = submissionService.getAttemptHistory(assignmentId, studentAccountId);

        assertNotNull(history);
        assertEquals(2, history.size());
        assertEquals(2, history.get(0).getAttemptNumber());
        assertEquals(8.0, history.get(0).getScore());
        assertEquals(1, history.get(1).getAttemptNumber());
    }

    @Test
    void getAttemptHistory_Failure_AssignmentNotFound() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            submissionService.getAttemptHistory(assignmentId, studentAccountId);
        });
    }

    // ==========================================
    // 11. canAttemptAssignment
    // ==========================================

    @Test
    void canAttemptAssignment_Unlimited() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setMaxAttempts(null); // Unlimited

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));

        boolean canAttempt = submissionService.canAttemptAssignment(assignmentId, studentAccountId);

        assertTrue(canAttempt);
    }

    @Test
    void canAttemptAssignment_LimitReached() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setMaxAttempts(3);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.countCompletedAttempts(studentAccountId, assignmentId)).thenReturn(3L); // Limit reached

        boolean canAttempt = submissionService.canAttemptAssignment(assignmentId, studentAccountId);

        assertFalse(canAttempt);
    }

    // ==========================================
    // 12. getRemainingAttempts
    // ==========================================

    @Test
    void getRemainingAttempts_Unlimited() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setMaxAttempts(null); // Unlimited

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));

        int remaining = submissionService.getRemainingAttempts(assignmentId, studentAccountId);

        assertEquals(-1, remaining);
    }

    @Test
    void getRemainingAttempts_Limited() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setMaxAttempts(5);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.countCompletedAttempts(studentAccountId, assignmentId)).thenReturn(2L);

        int remaining = submissionService.getRemainingAttempts(assignmentId, studentAccountId);

        assertEquals(3, remaining);
    }

    // ==========================================
    // 13. startAssignment
    // ==========================================

    @Test
    void startAssignment_Success_NewDraft() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAccountIdAndAssignmentId(studentAccountId, assignmentId)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> {
            submissionService.startAssignment(assignmentId, studentAccountId);
        });

        verify(submissionRepository, times(1)).save(any(Submission.class));
    }

    @Test
    void startAssignment_Success_Idempotent() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);

        Submission existing = new Submission();
        existing.setId(10L);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAccountIdAndAssignmentId(studentAccountId, assignmentId)).thenReturn(Optional.of(existing));

        assertDoesNotThrow(() -> {
            submissionService.startAssignment(assignmentId, studentAccountId);
        });

        verify(submissionRepository, never()).save(any(Submission.class));
    }

    // ==========================================
    // 14. getCurrentSubmission
    // ==========================================

    @Test
    void getCurrentSubmission_Success() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setTitle("Quiz 1");

        Submission submission = new Submission();
        submission.setId(10L);
        submission.setAssignment(assignment);
        submission.setAccountId(studentAccountId);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAccountIdAndAssignmentId(studentAccountId, assignmentId)).thenReturn(Optional.of(submission));

        ViewSubmissionDto result = submissionService.getCurrentSubmission(assignmentId, studentAccountId);

        assertNotNull(result);
        assertEquals(10L, result.getId());
    }

    @Test
    void getCurrentSubmission_NotFound() {
        Long assignmentId = 1L;
        Long studentAccountId = 100L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAccountIdAndAssignmentId(studentAccountId, assignmentId)).thenReturn(Optional.empty());

        ViewSubmissionDto result = submissionService.getCurrentSubmission(assignmentId, studentAccountId);

        assertNull(result);
    }
}
