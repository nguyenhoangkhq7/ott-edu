package fit.iuh.modules.department.services;

import fit.iuh.modules.department.dtos.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId);
}
