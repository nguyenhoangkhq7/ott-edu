package fit.iuh.modules.school.services.impl;

import fit.iuh.modules.school.dtos.SchoolResponse;
import fit.iuh.modules.school.mappers.SchoolMapper;
import fit.iuh.modules.school.repositories.SchoolRepository;
import fit.iuh.modules.school.services.SchoolService;
import fit.iuh.models.School;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolServiceImpl implements SchoolService {
    private final SchoolRepository schoolRepository;
    private final SchoolMapper schoolMapper;

    @Override
    public List<SchoolResponse> getAllSchools() {
        return schoolMapper.toResponseList(schoolRepository.findAll());
    }

    @Override
    @Transactional
    public void updateSchoolName(Long schoolId, String name) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trường học."));
        school.setName(name);
        schoolRepository.save(school);
    }
}
