package fit.iuh.mappers;

import fit.iuh.dtos.AssignmentDTO;
import fit.iuh.models.AnswerOption;
import fit.iuh.models.Assignment;
import fit.iuh.models.Question;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class AssignmentMapper {

    public static Assignment toEntity(AssignmentDTO dto) {
        if (dto == null) return null;
        return Assignment.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .instructions(dto.getInstructions())
                .maxScore(dto.getMaxScore())
                .dueDate(dto.getDueDate())
                .type(dto.getType())
                .teamId(dto.getTeamId())
                .build();
    }

    public static AssignmentDTO toDTO(Assignment entity, List<Question> questions, List<AnswerOption> allOptions) {
        if (entity == null) return null;
        return AssignmentDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .instructions(entity.getInstructions())
                .maxScore(entity.getMaxScore())
                .dueDate(entity.getDueDate())
                .type(entity.getType())
                .teamId(entity.getTeamId())
                .questions(mapQuestions(questions, allOptions))
                .build();
    }

    private static List<AssignmentDTO.QuestionDTO> mapQuestions(List<Question> questions, List<AnswerOption> allOptions) {
        if (questions == null) return Collections.emptyList();
        return questions.stream()
                .map(q -> mapQuestion(q, allOptions))
                .collect(Collectors.toList());
    }

    private static AssignmentDTO.QuestionDTO mapQuestion(Question q, List<AnswerOption> allOptions) {
        List<AssignmentDTO.AnswerOptionDTO> oDTOs = allOptions.stream()
                .filter(o -> o.getQuestion().getId().equals(q.getId()))
                .map(o -> AssignmentDTO.AnswerOptionDTO.builder()
                        .id(o.getId())
                        .content(o.getContent())
                        .isCorrect(o.isCorrect())
                        .displayOrder(o.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return AssignmentDTO.QuestionDTO.builder()
                .id(q.getId())
                .content(q.getContent())
                .points(q.getPoints())
                .questionType(q.getQuestionType())
                .options(oDTOs)
                .build();
    }
}
