package fit.iuh.modules.department.services;

import fit.iuh.modules.department.dtos.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId);
    List<DepartmentResponse> getAllDepartments();
    DepartmentResponse createDepartment(Long schoolId, String name);
    DepartmentResponse updateDepartment(Long id, String name);
    void deleteDepartment(Long id);
}
