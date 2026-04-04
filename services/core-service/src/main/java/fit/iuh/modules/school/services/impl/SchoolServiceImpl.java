package fit.iuh.modules.school.services.impl;

import fit.iuh.modules.school.dtos.SchoolResponse;
import fit.iuh.modules.school.mappers.SchoolMapper;
import fit.iuh.modules.school.repositories.SchoolRepository;
import fit.iuh.modules.school.services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}
