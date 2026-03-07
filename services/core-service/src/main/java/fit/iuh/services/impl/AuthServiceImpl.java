package fit.iuh.services.impl;

import fit.iuh.config.JwtService;
import fit.iuh.dtos.auth.AuthUserResponse;
import fit.iuh.dtos.auth.LoginRequest;
import fit.iuh.dtos.auth.LoginResponse;
import fit.iuh.dtos.auth.LogoutRequest;
import fit.iuh.dtos.auth.RefreshTokenRequest;
import fit.iuh.dtos.auth.RefreshTokenResponse;
import fit.iuh.dtos.register.RegisterRequest;
import fit.iuh.models.*;
import fit.iuh.repositories.*;
import fit.iuh.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SchoolRepository schoolRepository;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;

    // Inject thêm DepartmentRepository để truy vấn Khoa/Trường
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public String register(RegisterRequest request) {
        // 1. Kiểm tra xem email đã được dùng chưa
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        // 2. Tìm Role (Quyền) theo tên gửi từ giao diện
        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quyền: " + request.getRoleName()));

        // 3. Tạo tài khoản đăng nhập (Account)
        Account newAccount = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(Set.of(role))
                .build();

        // Save để MySQL sinh ra ID (kiểu Long)
        newAccount = accountRepository.save(newAccount);

        School selectedSchool = null;
        Department selectedDepartment = null;
        String finalCustomSchool = null;
        String finalCustomDept = null;
        // Xử lý Trường (School)
        if (request.getSchoolId() != null) {
            selectedSchool = schoolRepository.findById(request.getSchoolId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Trường trong hệ thống!"));
        } else {
            if (request.getCustomSchool() == null || request.getCustomSchool().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng chọn Trường hoặc nhập tên Trường của bạn!");
            }
            finalCustomSchool = request.getCustomSchool().trim();
        }

        // Xử lý Khoa (Department)
        if (request.getDepartmentId() != null) {
            selectedDepartment = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Khoa trong hệ thống!"));

            // (Optional) Kiểm tra xem Khoa này có thực sự thuộc về Trường đã chọn ở trên không
            if (selectedSchool != null && !selectedDepartment.getSchool().getId().equals(selectedSchool.getId())) {
                throw new RuntimeException("Khoa được chọn không thuộc về Trường này!");
            }
        } else {
            if (request.getCustomDepartment() == null || request.getCustomDepartment().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng chọn Khoa hoặc nhập tên Khoa của bạn!");
            }
            finalCustomDept = request.getCustomDepartment().trim();
        }

        // 4. Tạo Hồ sơ (Profile)
        Profile newProfile = Profile.builder()
                .account(newAccount)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .code(request.getCode())
                .school(selectedSchool)                 // Lưu ID Trường (nếu có)
                .department(selectedDepartment)         // Lưu ID Khoa (nếu có)
                .customSchool(finalCustomSchool)        // Lưu Text Trường (nếu tự nhập)
                .customDepartment(finalCustomDept)      // Lưu Text Khoa (nếu tự nhập)
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

        // Rotate refresh token: token cũ bị thu hồi, token mới được phát hành.
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

        private AuthUserResponse buildUserResponse(Account account) {
        Profile profile = profileRepository.findById(account.getId()).orElse(null);

        List<String> roles = account.getRoles().stream()
            .map(Role::getName)
            .sorted()
            .collect(Collectors.toList());

        return AuthUserResponse.builder()
            .accountId(account.getId())
            .email(account.getEmail())
            .roles(roles)
            .firstName(profile != null ? profile.getFirstName() : null)
            .lastName(profile != null ? profile.getLastName() : null)
            .code(profile != null ? profile.getCode() : null)
            .schoolId(profile != null && profile.getSchool() != null ? profile.getSchool().getId() : null)
            .departmentId(profile != null && profile.getDepartment() != null ? profile.getDepartment().getId() : null)
            .customSchool(profile != null ? profile.getCustomSchool() : null)
            .customDepartment(profile != null ? profile.getCustomDepartment() : null)
            .build();
        }
}