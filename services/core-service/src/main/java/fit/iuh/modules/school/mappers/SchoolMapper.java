package fit.iuh.modules.school.mappers;

import fit.iuh.models.School;
import fit.iuh.modules.school.dtos.SchoolResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SchoolMapper {
    SchoolResponse toResponse(School school);

    List<SchoolResponse> toResponseList(List<School> schools);
}
