package fit.iuh.services;

import fit.iuh.dtos.AssignmentDTO;
import fit.iuh.exceptions.AppException;
import fit.iuh.mappers.AssignmentMapper;
import fit.iuh.models.Assignment;
import fit.iuh.repositories.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentMapper assignmentMapper;

    @Transactional
    public AssignmentDTO createAssignment(AssignmentDTO dto) {
        log.info("Creating new assignment: {}", dto.getTitle());
        Assignment assignment = assignmentMapper.toEntity(dto);
        
        // Ensure relationships are set for JPA cascade
        if (assignment.getQuestions() != null) {
            assignment.getQuestions().forEach(q -> {
                q.setAssignment(assignment);
                if (q.getOptions() != null) {
                    q.getOptions().forEach(opt -> opt.setQuestion(q));
                }
            });
        }
        
        Assignment saved = assignmentRepository.save(assignment);
        return assignmentMapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AssignmentDTO> getAssignmentsByTeamId(Long teamId) {
        log.info("Fetching assignments for team: {}", teamId);
        return assignmentRepository.findByTeamId(teamId).stream()
                .map(assignmentMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentDTO> getAllAssignments() {
        log.info("Fetching all assignments");
        return assignmentRepository.findAll().stream()
                .map(assignmentMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssignmentDTO getAssignmentById(Long id) {
        log.info("Fetching assignment: {}", id);
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));
        return assignmentMapper.toDTO(assignment);
    }
}
