package fit.iuh.services;

import fit.iuh.dtos.AssignmentDTO;
import fit.iuh.models.AnswerOption;
import fit.iuh.models.Assignment;
import fit.iuh.models.Question;
import fit.iuh.repositories.AnswerOptionRepository;
import fit.iuh.repositories.AssignmentRepository;
import fit.iuh.repositories.QuestionRepository;
import fit.iuh.mappers.AssignmentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;

    @Transactional
    public AssignmentDTO createAssignment(AssignmentDTO assignmentDTO) {
        log.info("Creating new assignment: {}", assignmentDTO.getTitle());
        
        // 1. Save Assignment Header
        Assignment assignment = AssignmentMapper.toEntity(assignmentDTO);
        Assignment savedAssignment = assignmentRepository.save(assignment);

        // 2. Save Questions & Options
        if (assignmentDTO.getQuestions() != null) {
            for (AssignmentDTO.QuestionDTO qDTO : assignmentDTO.getQuestions()) {
                Question question = Question.builder()
                        .content(qDTO.getContent())
                        .points(qDTO.getPoints())
                        .questionType(qDTO.getQuestionType())
                        .assignment(savedAssignment)
                        .build();
                questionRepository.save(question);

                if (qDTO.getOptions() != null) {
                    for (AssignmentDTO.AnswerOptionDTO oDTO : qDTO.getOptions()) {
                        AnswerOption option = AnswerOption.builder()
                                .content(oDTO.getContent())
                                .isCorrect(oDTO.isCorrect())
                                .displayOrder(oDTO.getDisplayOrder())
                                .question(question)
                                .build();
                        answerOptionRepository.save(option);
                    }
                }
            }
        }
        
        return getAssignmentById(savedAssignment.getId());
    }

    public List<AssignmentDTO> getAssignmentsByTeamId(Long teamId) {
        return assignmentRepository.findByTeamId(teamId).stream()
                .map(a -> {
                    List<Question> questions = questionRepository.findByAssignmentId(a.getId());
                    List<AnswerOption> options = questions.stream()
                        .flatMap(q -> answerOptionRepository.findByQuestionId(q.getId()).stream())
                        .collect(Collectors.toList());
                    return AssignmentMapper.toDTO(a, questions, options);
                })
                .collect(Collectors.toList());
    }

    public AssignmentDTO getAssignmentById(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
        
        List<Question> questions = questionRepository.findByAssignmentId(id);
        List<AnswerOption> options = questions.stream()
                .flatMap(q -> answerOptionRepository.findByQuestionId(q.getId()).stream())
                .collect(Collectors.toList());
                
        return AssignmentMapper.toDTO(assignment, questions, options);
    }
}
