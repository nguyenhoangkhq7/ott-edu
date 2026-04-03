package fit.iuh.modules.school.services.impl;

import fit.iuh.modules.school.dtos.SchoolResponse;
import fit.iuh.modules.school.repositories.SchoolRepository;
import fit.iuh.modules.school.services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchoolServiceImpl implements SchoolService {
    private final SchoolRepository schoolRepository;

    @Override
    public List<SchoolResponse> getAllSchools() {
        return schoolRepository.findAll().stream()
                .map(school -> SchoolResponse.builder()
                        .id(school.getId())
                        .name(school.getName())
                        .build())
                .collect(Collectors.toList());
    }
}
