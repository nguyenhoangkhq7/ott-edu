package fit.iuh.modules.auth.controllers;

import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import fit.iuh.modules.auth.config.JwtService;
import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.dtos.auth.ChangePasswordRequest;
import fit.iuh.modules.auth.dtos.auth.LoginRequest;
import fit.iuh.modules.auth.dtos.auth.LoginResponse;
import fit.iuh.modules.auth.dtos.auth.LogoutRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenResponse;
import fit.iuh.modules.auth.dtos.register.RegisterRequest;
import fit.iuh.modules.auth.services.AuthService;
import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final AuthService authService;
    private final JwtService jwtService;

    @Value("${app.cookie.path:/api/core/auth}")
    private String cookiePath;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @PostMapping("/register")
    public ResponseEntity<ApiSuccessResponse<String>> register(@RequestBody RegisterRequest request) {
        String result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseFactory.success(HttpStatus.CREATED, "Đăng ký tài khoản thành công.", result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiSuccessResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, response.getRefreshToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(jwtService.getRefreshTokenExpirationMs() / 1000)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(ApiResponseFactory.success(HttpStatus.OK, "Đăng nhập thành công.", response));
    }

    @PostMapping("/refresh")
        public ResponseEntity<ApiSuccessResponse<RefreshTokenResponse>> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            @CookieValue(value = REFRESH_COOKIE_NAME, required = false) String refreshTokenCookie
    ) {
        String refreshToken = extractRefreshToken(request, refreshTokenCookie);

        RefreshTokenRequest refreshTokenRequest = new RefreshTokenRequest();
        refreshTokenRequest.setRefreshToken(refreshToken);
        RefreshTokenResponse response = authService.refreshToken(refreshTokenRequest);

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, response.getRefreshToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(jwtService.getRefreshTokenExpirationMs() / 1000)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(ApiResponseFactory.success(HttpStatus.OK, "Làm mới token thành công.", response));
    }

    @PostMapping("/logout")
        public ResponseEntity<ApiSuccessResponse<Void>> logout(
            @RequestBody(required = false) LogoutRequest request,
            @CookieValue(value = REFRESH_COOKIE_NAME, required = false) String refreshTokenCookie
    ) {
        String refreshToken = extractRefreshToken(request, refreshTokenCookie);

        if (refreshToken != null) {
            LogoutRequest logoutRequest = new LogoutRequest();
            logoutRequest.setRefreshToken(refreshToken);
            authService.logout(logoutRequest);
        }

        ResponseCookie clearRefreshCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
            .body(ApiResponseFactory.success(HttpStatus.OK, "Đăng xuất thành công.", null));
    }

    @PostMapping("/change-password")
        public ResponseEntity<ApiSuccessResponse<String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Không tìm thấy phiên đăng nhập hợp lệ.");
        }

        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponseFactory.success(HttpStatus.OK, "Đổi mật khẩu thành công.", "Đổi mật khẩu thành công."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiSuccessResponse<AuthUserResponse>> currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Không tìm thấy phiên đăng nhập hợp lệ.");
        }

        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy thông tin người dùng thành công.", authService.getCurrentUser(authentication.getName()))
        );
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiSuccessResponse<Void>> validateAccessToken(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
            throw new BadCredentialsException("Thiếu access token hợp lệ.");
        }

        String token = authorizationHeader.substring(7);
        try {
            if (!jwtService.isAccessToken(token)) {
                throw new BadCredentialsException("Token cung cấp không phải access token.");
            }

            String subject = jwtService.extractSubject(token);
            if (!StringUtils.hasText(subject) || !jwtService.isTokenValid(token, subject)) {
                throw new BadCredentialsException("Access token không hợp lệ hoặc đã hết hạn.");
            }

            return ResponseEntity.ok(ApiResponseFactory.success(HttpStatus.OK, "Access token hợp lệ.", null));
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException("Access token không hợp lệ hoặc đã hết hạn.");
        }
    }

    private String extractRefreshToken(RefreshTokenRequest request, String refreshTokenCookie) {
        if (refreshTokenCookie != null && !refreshTokenCookie.isBlank()) {
            return refreshTokenCookie;
        }

        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            return request.getRefreshToken();
        }

        throw new BadCredentialsException("Refresh token khong hop le.");
    }

    private String extractRefreshToken(LogoutRequest request, String refreshTokenCookie) {
        if (refreshTokenCookie != null && !refreshTokenCookie.isBlank()) {
            return refreshTokenCookie;
        }

        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            return request.getRefreshToken();
        }

        return null;
    }
}
