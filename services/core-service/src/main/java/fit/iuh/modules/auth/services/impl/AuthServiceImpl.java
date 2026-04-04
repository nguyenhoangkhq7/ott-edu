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
import fit.iuh.modules.auth.dtos.auth.ForgotPasswordRequest;
import fit.iuh.modules.auth.dtos.auth.LoginRequest;
import fit.iuh.modules.auth.dtos.auth.LoginResponse;
import fit.iuh.modules.auth.dtos.auth.LogoutRequest;
import fit.iuh.modules.auth.dtos.auth.OtpChallengeResponse;
import fit.iuh.modules.auth.dtos.auth.OtpPurpose;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenRequest;
import fit.iuh.modules.auth.dtos.auth.RefreshTokenResponse;
import fit.iuh.modules.auth.dtos.auth.ResetPasswordRequest;
import fit.iuh.modules.auth.dtos.auth.UpdateProfileRequest;
import fit.iuh.modules.auth.dtos.auth.VerifyOtpRequest;
import fit.iuh.modules.auth.dtos.auth.VerifyOtpResponse;
import fit.iuh.modules.auth.dtos.register.RegisterRequest;
import fit.iuh.modules.auth.mappers.AuthMapper;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.RefreshTokenRepository;
import fit.iuh.modules.auth.services.AuthService;
import fit.iuh.modules.auth.services.support.OtpChallenge;
import fit.iuh.modules.auth.services.support.OtpChallengeManager;
import fit.iuh.modules.auth.services.support.OtpEmailService;
import fit.iuh.modules.auth.services.support.storage.AvatarStorageService;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.school.repositories.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final SchoolRepository schoolRepository;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final DepartmentRepository departmentRepository;
    private final AuthMapper authMapper;
    private final OtpChallengeManager otpChallengeManager;
    private final OtpEmailService otpEmailService;
    private final AvatarStorageService avatarStorageService;

    @Value("${app.otp.ttl-seconds:300}")
    private long otpTtlSeconds;

    @Value("${app.otp.max-attempts:5}")
    private int otpMaxAttempts;

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

        if (request.getSchoolId() == null) {
            throw new RuntimeException("Vui lòng chọn Trường!");
        }

        if (request.getDepartmentId() == null) {
            throw new RuntimeException("Vui lòng chọn Khoa!");
        }

        School selectedSchool = schoolRepository.findById(request.getSchoolId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trường trong hệ thống!"));

        Department selectedDepartment = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Khoa trong hệ thống!"));

        if (!selectedDepartment.getSchool().getId().equals(selectedSchool.getId())) {
            throw new RuntimeException("Khoa được chọn không thuộc về Trường này!");
        }

        Profile newProfile = Profile.builder()
                .account(newAccount)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .code(request.getCode())
                .school(selectedSchool)
                .department(selectedDepartment)
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
        tokenEntity.setReplacedAt(LocalDateTime.now());
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
    @Transactional(readOnly = true)
    public OtpChallengeResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Account account = accountRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống."));

        return sendOtpChallenge(account.getEmail(), OtpPurpose.FORGOT_PASSWORD, "khoi phuc mat khau");
    }

    @Override
    @Transactional(readOnly = true)
    public OtpChallengeResponse sendChangePasswordOtp(String email) {
        Account account = accountRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new BadCredentialsException("Không tìm thấy người dùng đang đăng nhập."));

        return sendOtpChallenge(account.getEmail(), OtpPurpose.CHANGE_PASSWORD, "doi mat khau");
    }

    @Override
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String email = otpChallengeManager.verifyAndConsume(
                request.getChallengeId(),
                request.getPurpose(),
                request.getOtpCode(),
                passwordEncoder
        );

        String verifiedToken = jwtService.generateOtpVerifiedToken(email, request.getPurpose());
        return VerifyOtpResponse.builder()
                .verifiedToken(verifiedToken)
                .expiresIn(jwtService.getOtpVerifiedTokenExpirationMs() / 1000)
                .build();
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp.");
        }

        if (!jwtService.isOtpVerifiedTokenForPurpose(request.getVerifiedToken(), OtpPurpose.FORGOT_PASSWORD)) {
            throw new BadCredentialsException("Phiên xác thực OTP không hợp lệ hoặc đã hết hạn.");
        }

        String email = jwtService.extractSubject(request.getVerifiedToken());
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Tài khoản không tồn tại."));

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);

        revokeActiveRefreshTokens(account.getId());
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp.");
        }

        if (!jwtService.isOtpVerifiedTokenForPurpose(request.getVerifiedToken(), OtpPurpose.CHANGE_PASSWORD)) {
            throw new BadCredentialsException("Phiên xác thực OTP không hợp lệ hoặc đã hết hạn.");
        }

        String verifiedEmail = jwtService.extractSubject(request.getVerifiedToken());
        if (!normalizeEmail(email).equals(normalizeEmail(verifiedEmail))) {
            throw new BadCredentialsException("Phiên xác thực OTP không thuộc về tài khoản hiện tại.");
        }

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Không tìm thấy người dùng đang đăng nhập."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không đúng.");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);

        revokeActiveRefreshTokens(account.getId());
    }

    @Override
    @Transactional
    public AuthUserResponse updateCurrentUser(String email, UpdateProfileRequest request) {
        Account account = accountRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new BadCredentialsException("Không tìm thấy người dùng đang đăng nhập."));

        Profile profile = profileRepository.findById(account.getId())
                .orElseGet(() -> Profile.builder().account(account).build());

        if (request.getFullName() != null) {
            String[] nameParts = splitFullName(request.getFullName());
            profile.setFirstName(nameParts[0]);
            profile.setLastName(nameParts[1]);
        }

        if (request.getAbout() != null) {
            profile.setBio(normalizeOptionalText(request.getAbout()));
        }

        if (request.getPhone() != null) {
            profile.setPhone(normalizeOptionalText(request.getPhone()));
        }

        if (request.getAvatarUrl() != null) {
            String newAvatarUrl = normalizeOptionalText(request.getAvatarUrl());
            String currentAvatarUrl = profile.getAvatarUrl();

            if (!StringUtils.hasText(newAvatarUrl) && StringUtils.hasText(currentAvatarUrl)) {
                avatarStorageService.deleteAvatarByUrl(currentAvatarUrl);
            }

            profile.setAvatarUrl(newAvatarUrl);
        }

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa được chọn."));
            profile.setDepartment(department);
            profile.setSchool(department.getSchool());
        }

        Profile savedProfile = profileRepository.save(profile);
        return authMapper.toAuthUserResponse(account, savedProfile);
    }

    @Override
    @Transactional
    public String uploadAvatar(String email, MultipartFile file) {
        Account account = accountRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new BadCredentialsException("Không tìm thấy người dùng đang đăng nhập."));
        Profile profile = profileRepository.findById(account.getId())
                .orElseGet(() -> Profile.builder().account(account).build());

        String avatarUrl = avatarStorageService.uploadAvatar(account.getId(), file, profile.getAvatarUrl());
        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);

        return avatarUrl;
    }

    private AuthUserResponse buildUserResponse(Account account) {
        Profile profile = profileRepository.findById(account.getId()).orElse(null);

        return authMapper.toAuthUserResponse(account, profile);
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

    private OtpChallengeResponse sendOtpChallenge(String email, OtpPurpose purpose, String purposeLabel) {
        String otpCode = generateOtpCode();
        OtpChallenge challenge = otpChallengeManager.createChallenge(
                email,
                purpose,
                passwordEncoder.encode(otpCode),
                otpTtlSeconds,
                otpMaxAttempts
        );

        try {
            otpEmailService.sendOtp(email, otpCode, purposeLabel, otpTtlSeconds);
        } catch (Exception ex) {
            throw new RuntimeException("Không thể gửi mã OTP. Vui lòng thử lại sau.");
        }

        return OtpChallengeResponse.builder()
                .challengeId(challenge.getId())
                .maskedEmail(maskEmail(email))
                .expiresIn(otpTtlSeconds)
                .build();
    }

    private String generateOtpCode() {
        return String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        return email.trim().toLowerCase();
    }

    private String maskEmail(String email) {
        String normalized = normalizeEmail(email);
        int atIndex = normalized.indexOf('@');
        if (atIndex <= 1) {
            return normalized;
        }

        return normalized.charAt(0) + "***" + normalized.substring(atIndex - 1);
    }

    private String[] splitFullName(String fullName) {
        String normalized = normalizeOptionalText(fullName);
        if (!StringUtils.hasText(normalized)) {
            return new String[]{null, null};
        }

        String[] parts = normalized.split("\\s+");
        if (parts.length == 1) {
            return new String[]{parts[0], null};
        }

        String firstName = parts[parts.length - 1];
        String lastName = String.join(" ", java.util.Arrays.copyOf(parts, parts.length - 1));
        return new String[]{firstName, lastName};
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void revokeActiveRefreshTokens(Long accountId) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountIdAndRevokedFalse(accountId);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);
    }
}
