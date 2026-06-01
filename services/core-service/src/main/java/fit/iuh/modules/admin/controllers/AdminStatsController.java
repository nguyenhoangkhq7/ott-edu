package fit.iuh.modules.admin.controllers;

import fit.iuh.modules.admin.dtos.TopActiveUser;
import fit.iuh.modules.admin.dtos.UserGrowthPoint;
import fit.iuh.modules.admin.services.AdminUserService;
import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminUserService adminUserService;

    @GetMapping("/user-growth")
    public ResponseEntity<ApiSuccessResponse<List<UserGrowthPoint>>> getUserGrowthStats(
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        List<UserGrowthPoint> result = adminUserService.getUserGrowthStats();
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy thống kê tăng trưởng người dùng thành công.", result)
        );
    }

    @GetMapping("/top-users")
    public ResponseEntity<ApiSuccessResponse<List<TopActiveUser>>> getTopActiveUsers(
            Authentication authentication
    ) {
        checkAdminAccess(authentication);
        List<TopActiveUser> result = adminUserService.getTopActiveUsers();
        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy danh sách người dùng tương tác tích cực thành công.", result)
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
