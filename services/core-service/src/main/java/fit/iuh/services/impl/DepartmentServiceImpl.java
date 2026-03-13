package fit.iuh.services.impl;

import fit.iuh.dtos.department.DepartmentResponse;
import fit.iuh.repositories.DepartmentRepository;
import fit.iuh.repositories.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements fit.iuh.services.DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final SchoolRepository schoolRepository;


    @Override
    public List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId) {
        return departmentRepository.findBySchoolId(schoolId).stream()
                .map(dept -> DepartmentResponse.builder()
                        .id(dept.getId())
                        .name(dept.getDepartmentName())
                        .schoolId(dept.getSchool().getId()) // Lấy ID của School chứa nó
                        .build())
                .collect(Collectors.toList());
    }
}
