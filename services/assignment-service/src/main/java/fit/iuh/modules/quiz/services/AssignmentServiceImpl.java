package fit.iuh.modules.quiz.services;

import fit.iuh.common.exceptions.AccessDeniedException;
import fit.iuh.common.exceptions.ResourceNotFoundException;
import fit.iuh.modules.quiz.dtos.*;
import fit.iuh.modules.quiz.models.Assignment;
import fit.iuh.modules.quiz.repositories.AssignmentRepository;
import fit.iuh.modules.quiz.repositories.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Implementation of AssignmentService
 *
 * Handles TEACHER and STUDENT operations for assignments with RBAC enforcement.
 */
@Service
@Transactional
public class AssignmentServiceImpl implements AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    // ============== TEACHER Operations ==============

    @Override
    public AssignmentSummaryDto createAssignment(CreateAssignmentRequest request, Long creatorId) {
        Assignment assignment = new Assignment();
        assignment.setTitle(request.getTitle());
        assignment.setInstructions(request.getInstructions());
        assignment.setType(request.getType());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxScore(request.getMaxScore());
        assignment.setCreatorId(creatorId);
        assignment.setTeamIds(request.getTeamIds());
        assignment.setCreatedAt(LocalDateTime.now());

        Assignment saved = assignmentRepository.save(assignment);
        return toSummaryDto(saved);
    }

    @Override
    public AssignmentSummaryDto updateAssignment(Long assignmentId, UpdateAssignmentRequest request, Long creatorId) {
        Assignment assignment = assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)
                .orElseThrow(() -> {
                    Assignment existing = assignmentRepository.findById(assignmentId).orElse(null);
                    if (existing != null && !existing.getCreatorId().equals(creatorId)) {
                        return AccessDeniedException.notAssignmentCreator(creatorId, assignmentId);
                    }
                    return ResourceNotFoundException.assignmentNotFound(assignmentId);
                });

        assignment.setTitle(request.getTitle());
        assignment.setInstructions(request.getInstructions());
        assignment.setType(request.getType());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxScore(request.getMaxScore());
        assignment.setTeamIds(request.getTeamIds());

        Assignment updated = assignmentRepository.save(assignment);
        return toSummaryDto(updated);
    }

    @Override
    public Page<AssignmentTeacherViewDto> getMyAssignments(Long creatorId, Pageable pageable) {
        Page<Assignment> assignments = assignmentRepository.findByCreatorId(creatorId, pageable);
        return assignments.map(this::toTeacherViewDto);
    }

    @Override
    public void archiveAssignment(Long assignmentId, Long creatorId) {
        Assignment assignment = assignmentRepository.findByIdAndCreatorId(assignmentId, creatorId)
                .orElseThrow(() -> {
                    Assignment existing = assignmentRepository.findById(assignmentId).orElse(null);
                    if (existing != null && !existing.getCreatorId().equals(creatorId)) {
                        return AccessDeniedException.notAssignmentCreator(creatorId, assignmentId);
                    }
                    return ResourceNotFoundException.assignmentNotFound(assignmentId);
                });

        assignment.setArchivedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);
    }

    // ============== STUDENT Operations ==============

    @Override
    public Page<AssignmentSummaryDto> getAssignmentsByTeam(Long teamId, Pageable pageable) {
        Page<Assignment> assignments = assignmentRepository.findByTeamId(teamId, pageable);
        return assignments.map(this::toSummaryDto);
    }

    @Override
    public AssignmentDetailDto getAssignmentDetail(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> ResourceNotFoundException.assignmentNotFound(assignmentId));

        return toDetailDto(assignment);
    }

    @Override
    public AssignmentSummaryDto getAssignmentById(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> ResourceNotFoundException.assignmentNotFound(assignmentId));

        return toSummaryDto(assignment);
    }

    // ============== Helper Methods ==============

    /**
     * Convert Assignment entity to summary DTO (for list views)
     */
    private AssignmentSummaryDto toSummaryDto(Assignment assignment) {
        AssignmentSummaryDto dto = new AssignmentSummaryDto();
        dto.setId(assignment.getId());
        dto.setTitle(assignment.getTitle());
        dto.setInstructions(assignment.getInstructions());
        dto.setMaxScore(assignment.getMaxScore());
        dto.setDueDate(assignment.getDueDate());
        dto.setType(assignment.getType());
        dto.setTeamIds(assignment.getTeamIds());
        dto.setArchivedAt(assignment.getArchivedAt());
        return dto;
    }

    /**
     * Convert Assignment entity to teacher view DTO (includes metadata)
     */
    private AssignmentTeacherViewDto toTeacherViewDto(Assignment assignment) {
        AssignmentTeacherViewDto dto = new AssignmentTeacherViewDto();
        dto.setId(assignment.getId());
        dto.setTitle(assignment.getTitle());
        dto.setInstructions(assignment.getInstructions());
        dto.setMaxScore(assignment.getMaxScore());
        dto.setDueDate(assignment.getDueDate());
        dto.setType(assignment.getType());
        dto.setTeamIds(assignment.getTeamIds());
        dto.setCreatorId(assignment.getCreatorId());
        dto.setCreatedAt(assignment.getCreatedAt());
        dto.setArchivedAt(assignment.getArchivedAt());
        dto.setDepartmentId(assignment.getDepartmentId());
        dto.setArchived(assignment.getArchivedAt() != null);

        // Load submission metadata
        Long gradedCount = submissionRepository.countGradedByAssignmentId(assignment.getId());
        Long pendingCount = submissionRepository.countPendingGradesByAssignmentId(assignment.getId());
        Long totalSubmissions = gradedCount + pendingCount;

        dto.setTotalSubmissions(totalSubmissions.intValue());
        dto.setGradedSubmissions(gradedCount.intValue());
        dto.setPendingSubmissions(pendingCount.intValue());

        return dto;
    }

    /**
     * Convert Assignment entity to detailed DTO (includes questions, for students
     * doing assignment)
     * NOTE: Does NOT expose correct answers
     */
    private AssignmentDetailDto toDetailDto(Assignment assignment) {
        AssignmentDetailDto dto = new AssignmentDetailDto();
        dto.setId(assignment.getId());
        dto.setTitle(assignment.getTitle());
        dto.setInstructions(assignment.getInstructions());
        dto.setMaxScore(assignment.getMaxScore());
        dto.setDueDate(assignment.getDueDate());
        dto.setType(assignment.getType());
        dto.setTeamIds(assignment.getTeamIds());

        // Convert questions to DTOs (without exposing correct answers)
        if (assignment.getQuestions() != null) {
            dto.setQuestions(
                    assignment.getQuestions().stream()
                            .map(q -> {
                                QuestionDto qDto = new QuestionDto();
                                qDto.setId(q.getId());
                                qDto.setContent(q.getContent());
                                qDto.setType(q.getType());
                                qDto.setPoints(q.getPoints());
                                qDto.setDisplayOrder(q.getDisplayOrder());

                                // Set answer options WITHOUT exposing is_correct field
                                qDto.setOptions(
                                        q.getOptions().stream()
                                                .map(opt -> {
                                                    AnswerOptionDto optDto = new AnswerOptionDto();
                                                    optDto.setId(opt.getId());
                                                    optDto.setContent(opt.getContent());
                                                    // DO NOT include optDto.setIsCorrect() - security measure
                                                    optDto.setDisplayOrder(opt.getDisplayOrder());
                                                    return optDto;
                                                })
                                                .collect(Collectors.toList()));
                                return qDto;
                            })
                            .collect(Collectors.toList()));
        }

        return dto;
    }
}
