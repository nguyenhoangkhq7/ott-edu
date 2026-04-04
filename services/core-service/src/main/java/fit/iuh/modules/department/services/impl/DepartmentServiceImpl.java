package fit.iuh.modules.department.services.impl;

import fit.iuh.modules.department.dtos.DepartmentResponse;
import fit.iuh.modules.department.mappers.DepartmentMapper;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.department.services.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Override
    public List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId) {
        return departmentMapper.toResponseList(departmentRepository.findBySchoolId(schoolId));
    }
}
