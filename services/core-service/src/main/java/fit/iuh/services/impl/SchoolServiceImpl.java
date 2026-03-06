package fit.iuh.services.impl;


import fit.iuh.dtos.school.SchoolResponse;
import fit.iuh.repositories.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchoolServiceImpl implements fit.iuh.services.SchoolService {
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
