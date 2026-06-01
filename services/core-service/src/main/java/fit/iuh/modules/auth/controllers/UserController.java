package fit.iuh.modules.auth.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.services.UserService;
import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<ApiSuccessResponse<List<AuthUserResponse>>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Authentication authentication // 👈 Lấy thông tin ông Hậu từ Token
    ) {
        // Lấy Email của người đang đăng nhập
        String currentUserEmail = authentication != null ? authentication.getName() : "";

        // Chuyền Email xuống Service
        List<AuthUserResponse> users = userService.searchUsers(keyword, currentUserEmail);

        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Tìm kiếm thành công.", users)
        );
    }
}
