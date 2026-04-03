package fit.iuh.modules.school.controllers;

import fit.iuh.modules.department.dtos.DepartmentResponse;
import fit.iuh.modules.department.services.DepartmentService;
import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import fit.iuh.modules.school.dtos.SchoolResponse;
import fit.iuh.modules.school.services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;
    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiSuccessResponse<List<SchoolResponse>>> getAllSchools() {
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy danh sách trường thành công.", schoolService.getAllSchools())
        );
    }

    @GetMapping("/{schoolId}/departments")
    public ResponseEntity<ApiSuccessResponse<List<DepartmentResponse>>> getDepartmentsBySchoolId(@PathVariable Long schoolId) {
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Lấy danh sách khoa theo trường thành công.",
                        departmentService.getDepartmentsBySchoolId(schoolId)
                )
        );
    }
}
