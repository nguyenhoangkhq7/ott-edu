package fit.iuh.services;

import fit.iuh.dtos.department.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId);
}
