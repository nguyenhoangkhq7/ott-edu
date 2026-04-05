package fit.iuh.mappers;

import fit.iuh.dtos.AnswerOptionDTO;
import fit.iuh.dtos.AssignmentDTO;
import fit.iuh.dtos.QuestionDTO;
import fit.iuh.models.AnswerOption;
import fit.iuh.models.Assignment;
import fit.iuh.models.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AssignmentMapper {

    AssignmentDTO toDTO(Assignment assignment);

    Assignment toEntity(AssignmentDTO dto);

    QuestionDTO toDTO(Question question);

    Question toEntity(QuestionDTO dto);

    AnswerOptionDTO toDTO(AnswerOption option);

    @Mapping(target = "question", ignore = true)
    AnswerOption toEntity(AnswerOptionDTO dto);
}
