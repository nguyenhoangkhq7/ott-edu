package fit.iuh.services;

import fit.iuh.dtos.school.SchoolResponse;

import java.util.List;

public interface SchoolService {
    List<SchoolResponse> getAllSchools();
}
