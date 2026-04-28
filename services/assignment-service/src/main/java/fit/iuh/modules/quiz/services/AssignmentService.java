package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Assignment operations
 * 
 * Handles both TEACHER and STUDENT operations related to assignments:
 * - TEACHER: Create, update, load assignments, assign to teams
 * - STUDENT: Load assignments for their team
 */
public interface AssignmentService {

    // ============== TEACHER Operations ==============

    /**
     * Create a new assignment (TEACHER only)
     * 
     * @param request The assignment creation request with title, description, due date, etc.
     * @param creatorId The teacher's account ID (extracted from SecurityContext)
     * @return The created assignment as DTO
     */
    AssignmentSummaryDto createAssignment(CreateAssignmentRequest request, Long creatorId);

    /**
     * Update an existing assignment (TEACHER only)
     * Only the creator can update their own assignment.
     * 
     * @param assignmentId The assignment ID to update
     * @param request The update request with new values
     * @param creatorId The teacher's account ID (for authorization check)
     * @return The updated assignment as DTO
     */
    AssignmentSummaryDto updateAssignment(Long assignmentId, UpdateAssignmentRequest request, Long creatorId);

    /**
     * Get all assignments created by a teacher (TEACHER only, with pagination)
     * 
     * @param creatorId The teacher's account ID
     * @param pageable Pagination info
     * @return Page of teacher's assignments with metadata
     */
    Page<AssignmentTeacherViewDto> getMyAssignments(Long creatorId, Pageable pageable);

    /**
     * Archive an assignment (TEACHER only)
     * Only the creator can archive their own assignment.
     * 
     * @param assignmentId The assignment ID to archive
     * @param creatorId The teacher's account ID (for authorization check)
     */
    void archiveAssignment(Long assignmentId, Long creatorId);

    // ============== STUDENT Operations ==============

    /**
     * Get all assignments assigned to a student's team (STUDENT only, with pagination)
     * 
     * @param teamId The student's team ID
     * @param pageable Pagination info
     * @return Page of assignments for the student's team
     */
    Page<AssignmentSummaryDto> getAssignmentsByTeam(Long teamId, Pageable pageable);

    /**
     * Get detailed information about an assignment (STUDENT can view any available assignment)
     * Returns question details without exposing correct answers.
     * 
     * @param assignmentId The assignment ID
     * @return Detailed assignment information with questions
     */
    AssignmentDetailDto getAssignmentDetail(Long assignmentId);

    /**
     * Get an assignment by ID (internal use for validation)
     * 
     * @param assignmentId The assignment ID
     * @return Assignment or throws ResourceNotFoundException
     */
    AssignmentSummaryDto getAssignmentById(Long assignmentId);
}
