package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.RefreshToken;
import fit.iuh.models.Role;
import fit.iuh.models.School;
import fit.iuh.modules.auth.config.JwtService;
import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.dtos.auth.ChangePasswordRequest;
import fit.iuh.modules.auth.dtos.auth.LoginRequest;
import fit.iuh.modules.auth.dtos.auth.LoginResponse;
import fit.iuh.modules.auth.dtos.auth.LogoutRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenResponse;
import fit.iuh.modules.auth.dtos.register.RegisterRequest;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.RefreshTokenRepository;
import fit.iuh.modules.auth.services.AuthService;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.school.repositories.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final SchoolRepository schoolRepository;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public String register(RegisterRequest request) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        Role role;
        try {
            role = parseRole(request.getRoleName());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Không tìm thấy quyền: " + request.getRoleName());
        }

        Account newAccount = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        newAccount = accountRepository.save(newAccount);

        School selectedSchool = null;
        Department selectedDepartment = null;
        String finalCustomSchool = null;
        String finalCustomDept = null;

        if (request.getSchoolId() != null) {
            selectedSchool = schoolRepository.findById(request.getSchoolId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Trường trong hệ thống!"));
        } else {
            if (request.getCustomSchool() == null || request.getCustomSchool().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng chọn Trường hoặc nhập tên Trường của bạn!");
            }
            finalCustomSchool = request.getCustomSchool().trim();
        }

        if (request.getDepartmentId() != null) {
            selectedDepartment = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Khoa trong hệ thống!"));

            if (selectedSchool != null && !selectedDepartment.getSchool().getId().equals(selectedSchool.getId())) {
                throw new RuntimeException("Khoa được chọn không thuộc về Trường này!");
            }
        } else {
            if (request.getCustomDepartment() == null || request.getCustomDepartment().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng chọn Khoa hoặc nhập tên Khoa của bạn!");
            }
            finalCustomDept = request.getCustomDepartment().trim();
        }

        Profile newProfile = Profile.builder()
                .account(newAccount)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .code(request.getCode())
                .school(selectedSchool)
                .department(selectedDepartment)
                .customSchool(finalCustomSchool)
                .customDepartment(finalCustomDept)
                .build();

        profileRepository.save(newProfile);

        return "Tạo tài khoản thành công!";
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        Account account = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng."));

        String accessToken = jwtService.generateAccessToken(account);
        String refreshToken = jwtService.generateRefreshToken(account);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .account(account)
                .tokenValue(refreshToken)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpirationMs() / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtService.getAccessTokenExpirationMs() / 1000)
                .user(buildUserResponse(account))
                .build();
    }

    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken tokenEntity = refreshTokenRepository
                .findByTokenValueAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new BadCredentialsException("Refresh token không hợp lệ."));

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenEntity.setRevoked(true);
            refreshTokenRepository.save(tokenEntity);
            throw new BadCredentialsException("Refresh token đã hết hạn.");
        }

        if (!jwtService.isTokenValid(request.getRefreshToken(), tokenEntity.getAccount().getEmail())
                || !jwtService.isRefreshToken(request.getRefreshToken())) {
            tokenEntity.setRevoked(true);
            refreshTokenRepository.save(tokenEntity);
            throw new BadCredentialsException("Refresh token không hợp lệ.");
        }

        Account account = tokenEntity.getAccount();

        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);

        String newAccessToken = jwtService.generateAccessToken(account);
        String newRefreshToken = jwtService.generateRefreshToken(account);

        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .account(account)
                .tokenValue(newRefreshToken)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpirationMs() / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRefreshTokenEntity);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtService.getAccessTokenExpirationMs() / 1000)
                .build();
    }

    @Override
    @Transactional
    public void logout(LogoutRequest request) {
        if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenValueAndRevokedFalse(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Không tìm thấy người dùng đang đăng nhập."));

        return buildUserResponse(account);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp.");
        }

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Không tìm thấy người dùng đang đăng nhập."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không đúng.");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);

        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountIdAndRevokedFalse(account.getId());
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);
    }

    private AuthUserResponse buildUserResponse(Account account) {
        Profile profile = profileRepository.findById(account.getId()).orElse(null);

        return AuthUserResponse.builder()
                .accountId(account.getId())
                .email(account.getEmail())
                .roles(List.of(account.getRole().name()))
                .firstName(profile != null ? profile.getFirstName() : null)
                .lastName(profile != null ? profile.getLastName() : null)
                .code(profile != null ? profile.getCode() : null)
                .schoolId(profile != null && profile.getSchool() != null ? profile.getSchool().getId() : null)
                .departmentId(profile != null && profile.getDepartment() != null ? profile.getDepartment().getId() : null)
                .customSchool(profile != null ? profile.getCustomSchool() : null)
                .customDepartment(profile != null ? profile.getCustomDepartment() : null)
                .build();
    }

    private Role parseRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("roleName is blank");
        }

        String normalized = roleName.trim().toUpperCase();
        if ("ROLE_INSTRUCTOR".equals(normalized)) {
            normalized = "ROLE_TEACHER";
        }

        return Role.valueOf(normalized);
    }
}
