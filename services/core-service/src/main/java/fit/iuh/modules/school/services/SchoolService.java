package fit.iuh.modules.school.services;

import fit.iuh.modules.school.dtos.SchoolResponse;

import java.util.List;

public interface SchoolService {
    List<SchoolResponse> getAllSchools();
}
