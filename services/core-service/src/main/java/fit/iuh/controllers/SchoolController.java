package fit.iuh.controllers;


import fit.iuh.dtos.department.DepartmentResponse;
import fit.iuh.dtos.school.SchoolResponse;
import fit.iuh.services.DepartmentService;
import fit.iuh.services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/schools") // Đổi endpoint cho chuẩn REST
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;
    private final DepartmentService departmentService;

    // 1. Lấy danh sách tất cả các Trường
    // GET: /schools
    @GetMapping
    public ResponseEntity<List<SchoolResponse>> getAllSchools() {
        return ResponseEntity.ok(schoolService.getAllSchools());
    }

    // 2. Lấy danh sách Khoa theo ID Trường
    // GET: /schools/{schoolId}/departments
    @GetMapping("/{schoolId}/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartmentsBySchoolId(@PathVariable Long schoolId) {
        return ResponseEntity.ok(departmentService.getDepartmentsBySchoolId(schoolId));
    }
}
