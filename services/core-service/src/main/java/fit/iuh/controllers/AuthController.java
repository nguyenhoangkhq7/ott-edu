package fit.iuh.controllers;


import fit.iuh.dtos.auth.LoginRequest;
import fit.iuh.dtos.auth.LoginResponse;
import fit.iuh.dtos.auth.LogoutRequest;
import fit.iuh.dtos.auth.RefreshTokenRequest;
import fit.iuh.dtos.auth.RefreshTokenResponse;
import fit.iuh.dtos.auth.AuthUserResponse;
import fit.iuh.dtos.register.RegisterRequest;
import fit.iuh.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        String result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Không tìm thấy phiên đăng nhập hợp lệ.");
        }

        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }
}
