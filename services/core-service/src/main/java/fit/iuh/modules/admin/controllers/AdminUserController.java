package fit.iuh.modules.admin.controllers;

import fit.iuh.modules.admin.dtos.AdminUserResponse;
import fit.iuh.modules.admin.dtos.CreateUserRequest;
import fit.iuh.modules.admin.dtos.UpdateUserRequest;
import fit.iuh.modules.admin.dtos.UserSummaryResponse;
import fit.iuh.modules.admin.services.AdminUserService;
import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiSuccessResponse<Page<AdminUserResponse>>> getUsers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        Page<AdminUserResponse> result = adminUserService.getUsers(search, role, status, page, size);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy danh sách người dùng thành công.", result)
        );
    }

    @PostMapping
    public ResponseEntity<ApiSuccessResponse<AdminUserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        AdminUserResponse result = adminUserService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponseFactory.success(HttpStatus.CREATED, "Tạo người dùng thành công.", result)
        );
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiSuccessResponse<AdminUserResponse>> updateUser(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        AdminUserResponse result = adminUserService.updateUser(userId, request);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Cập nhật người dùng thành công.", result)
        );
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteUser(
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        adminUserService.deleteUser(userId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Xóa người dùng thành công.", null)
        );
    }

    @PatchMapping("/{userId}/lock")
    public ResponseEntity<ApiSuccessResponse<Void>> lockUser(
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        adminUserService.lockUser(userId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Khóa tài khoản thành công.", null)
        );
    }

    @PatchMapping("/{userId}/unlock")
    public ResponseEntity<ApiSuccessResponse<Void>> unlockUser(
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        adminUserService.unlockUser(userId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Mở khóa tài khoản thành công.", null)
        );
    }

    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<ApiSuccessResponse<String>> resetUserPassword(
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        String tempPassword = adminUserService.resetUserPassword(userId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Đặt lại mật khẩu thành công.", tempPassword)
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiSuccessResponse<UserSummaryResponse>> getUserSummary(
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        UserSummaryResponse summary = adminUserService.getUserSummary();
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy thông tin tổng quan thành công.", summary)
        );
    }

    @PostMapping(value = "/import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiSuccessResponse<Void>> importUsers(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        adminUserService.importUsersFromExcel(file);
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Nhập danh sách người dùng từ Excel thành công.", null)
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
