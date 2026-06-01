package fit.iuh.modules.admin.controllers;

import fit.iuh.modules.department.dtos.DepartmentResponse;
import fit.iuh.modules.department.services.DepartmentService;
import fit.iuh.modules.school.dtos.SchoolResponse;
import fit.iuh.modules.school.services.SchoolService;
import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminSchoolDepartmentController {

    private final SchoolService schoolService;
    private final DepartmentService departmentService;

    @PutMapping("/schools/{schoolId}")
    public ResponseEntity<ApiSuccessResponse<Void>> renameSchool(
            @PathVariable Long schoolId,
            @RequestParam String name,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        schoolService.updateSchoolName(schoolId, name);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Đổi tên trường thành công.", null)
        );
    }

    @PostMapping("/departments")
    public ResponseEntity<ApiSuccessResponse<DepartmentResponse>> createDepartment(
            @RequestParam Long schoolId,
            @RequestParam String name,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        DepartmentResponse response = departmentService.createDepartment(schoolId, name);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponseFactory.success(HttpStatus.CREATED, "Thêm phòng ban thành công.", response)
        );
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<ApiSuccessResponse<DepartmentResponse>> updateDepartment(
            @PathVariable Long id,
            @RequestParam String name,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        DepartmentResponse response = departmentService.updateDepartment(id, name);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Cập nhật phòng ban thành công.", response)
        );
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteDepartment(
            @PathVariable Long id,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Xóa phòng ban thành công.", null)
        );
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiSuccessResponse<List<DepartmentResponse>>> getAllDepartments(
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        List<DepartmentResponse> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy danh sách phòng ban thành công.", departments)
        );
    }

    private void checkAdminAccess(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new AccessDeniedException("Bạn không có quyền thực hiện thao tác này.");
        }
    }
}
