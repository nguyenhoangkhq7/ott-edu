package create_assignment.mapper;

import create_assignment.dto.AssignmentResponseDTO;
import create_assignment.entities.AnswerOption;
import create_assignment.entities.Assignment;
import create_assignment.entities.Material;
import create_assignment.entities.Question;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AssignmentMapper {

    // Assignment → AssignmentResponseDTO
    AssignmentResponseDTO toResponseDTO(Assignment assignment);

    // Material → MaterialDTO
    AssignmentResponseDTO.MaterialDTO toMaterialDTO(Material material);

    // List<Material> → List<MaterialDTO>
    List<AssignmentResponseDTO.MaterialDTO> toMaterialDTOList(List<Material> materials);

    // Question → QuestionResponseDTO
    AssignmentResponseDTO.QuestionResponseDTO toQuestionResponseDTO(Question question);

    // List<Question> → List<QuestionResponseDTO>
    List<AssignmentResponseDTO.QuestionResponseDTO> toQuestionResponseDTOList(List<Question> questions);

    // AnswerOption → AnswerOptionResponseDTO
    AssignmentResponseDTO.AnswerOptionResponseDTO toAnswerOptionResponseDTO(AnswerOption answerOption);

    // List<AnswerOption> → List<AnswerOptionResponseDTO>
    List<AssignmentResponseDTO.AnswerOptionResponseDTO> toAnswerOptionResponseDTOList(List<AnswerOption> answerOptions);
}
