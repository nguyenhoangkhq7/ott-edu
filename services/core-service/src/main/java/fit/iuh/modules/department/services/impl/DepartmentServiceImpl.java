package fit.iuh.modules.department.services.impl;

import fit.iuh.modules.department.dtos.DepartmentResponse;
import fit.iuh.modules.department.mappers.DepartmentMapper;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.department.services.DepartmentService;
import fit.iuh.modules.team.repositories.TeamRepository;
import fit.iuh.modules.school.repositories.SchoolRepository;
import fit.iuh.models.Department;
import fit.iuh.models.School;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final SchoolRepository schoolRepository;
    private final DepartmentMapper departmentMapper;
    private final ProfileRepository profileRepository;
    private final TeamRepository teamRepository;

    @Override
    public List<DepartmentResponse> getDepartmentsBySchoolId(Long schoolId) {
        return departmentMapper.toResponseList(departmentRepository.findBySchoolId(schoolId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentMapper.toResponseList(departmentRepository.findAll());
    }

    @Override
    @Transactional
    public DepartmentResponse createDepartment(Long schoolId, String name) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trường học."));
        Department department = Department.builder()
                .school(school)
                .departmentName(name)
                .build();
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, String name) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa/phòng ban."));
        department.setDepartmentName(name);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khoa/phòng ban.");
        }
        if (teamRepository.existsByDepartmentId(id)) {
            throw new RuntimeException("Không thể xóa khoa/phòng ban đang có team.");
        }
        profileRepository.nullifyDepartmentRelations(id);
        departmentRepository.deleteById(id);
    }
}
