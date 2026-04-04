package fit.iuh.modules.department.mappers;

import fit.iuh.models.Department;
import fit.iuh.modules.department.dtos.DepartmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    @Mapping(target = "name", source = "departmentName")
    @Mapping(target = "schoolId", source = "school.id")
    DepartmentResponse toResponse(Department department);

    List<DepartmentResponse> toResponseList(List<Department> departments);
}
