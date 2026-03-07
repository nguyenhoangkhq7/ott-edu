package fit.iuh.controllers;


import fit.iuh.dtos.auth.LoginRequest;
import fit.iuh.dtos.auth.LoginResponse;
import fit.iuh.dtos.auth.LogoutRequest;
import fit.iuh.dtos.auth.RefreshTokenRequest;
import fit.iuh.dtos.auth.RefreshTokenResponse;
import fit.iuh.dtos.auth.AuthUserResponse;
import fit.iuh.dtos.register.RegisterRequest;
import fit.iuh.config.JwtService;
import fit.iuh.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        String result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
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
            .body(response);
    }

    @PostMapping("/refresh")
        public ResponseEntity<RefreshTokenResponse> refreshToken(
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
            .body(response);
    }

    @PostMapping("/logout")
        public ResponseEntity<Void> logout(
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

        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
            .build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Không tìm thấy phiên đăng nhập hợp lệ.");
        }

        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
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
