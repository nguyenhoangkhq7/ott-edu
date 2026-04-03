package fit.iuh.modules.department.services.impl;

import fit.iuh.modules.department.dtos.DepartmentResponse;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.department.services.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {
    private final DepartmentRepository departmentRepository;

    @Override
    public List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId) {
        return departmentRepository.findBySchoolId(schoolId).stream()
                .map(dept -> DepartmentResponse.builder()
                        .id(dept.getId())
                        .name(dept.getDepartmentName())
                        .schoolId(dept.getSchool().getId())
                        .build())
                .collect(Collectors.toList());
    }
}
