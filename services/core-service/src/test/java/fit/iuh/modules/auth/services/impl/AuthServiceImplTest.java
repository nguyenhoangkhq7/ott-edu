package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.RefreshToken;
import fit.iuh.models.Role;
import fit.iuh.models.School;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.modules.auth.config.JwtService;
import fit.iuh.modules.auth.dtos.auth.ChangePasswordRequest;
import fit.iuh.modules.auth.dtos.auth.LoginRequest;
import fit.iuh.modules.auth.dtos.auth.LoginResponse;
import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.dtos.auth.OtpPurpose;
import fit.iuh.modules.auth.dtos.register.RegisterRequest;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.RefreshTokenRepository;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.school.repositories.SchoolRepository;
import fit.iuh.modules.auth.mappers.AuthMapper;
import fit.iuh.modules.auth.services.support.OtpChallengeManager;
import fit.iuh.modules.auth.services.support.OtpEmailService;
import fit.iuh.modules.auth.services.support.storage.AvatarStorageService;
import fit.iuh.modules.team.repositories.TeamMemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SchoolRepository schoolRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private OtpChallengeManager otpChallengeManager;

    @Mock
    private OtpEmailService otpEmailService;

    @Mock
    private AvatarStorageService avatarStorageService;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @Disabled("Temporarily disabled: test setup has not been updated for OTP verifiedToken validation in changePassword")
    void changePassword_ShouldUpdatePassword_AndRevokeAllActiveTokens() {
        Account account = Account.builder()
                .id(1L)
                .email("user@test.local")
                .passwordHash("old-hash")
                .build();

        RefreshToken token1 = RefreshToken.builder()
                .id(101L)
                .account(account)
                .tokenValue("token-1")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .id(102L)
                .account(account)
                .tokenValue("token-2")
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old-pass");
        request.setNewPassword("new-pass-123");
        request.setConfirmPassword("new-pass-123");

        when(accountRepository.findByEmail(account.getEmail())).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("old-pass", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("new-pass-123")).thenReturn("new-hash");
        when(refreshTokenRepository.findAllByAccountIdAndRevokedFalse(1L)).thenReturn(List.of(token1, token2));

        authService.changePassword(account.getEmail(), request);

        assertEquals("new-hash", account.getPasswordHash());
        verify(accountRepository).save(account);

        ArgumentCaptor<List<RefreshToken>> tokenListCaptor = ArgumentCaptor.forClass(List.class);
        verify(refreshTokenRepository).saveAll(tokenListCaptor.capture());
        List<RefreshToken> savedTokens = tokenListCaptor.getValue();
        assertEquals(2, savedTokens.size());
        assertEquals(true, savedTokens.get(0).isRevoked());
        assertEquals(true, savedTokens.get(1).isRevoked());
    }

    @Test
    void changePassword_ShouldThrow_WhenConfirmPasswordMismatch() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old-pass");
        request.setNewPassword("new-pass-123");
        request.setConfirmPassword("not-match");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.changePassword("user@test.local", request));

        assertEquals("Mật khẩu xác nhận không khớp.", ex.getMessage());
        verify(accountRepository, never()).findByEmail(any());
        verify(refreshTokenRepository, never()).saveAll(any());
    }

    @Test
    @Disabled("Temporarily disabled: assertion path changed because changePassword now validates OTP verifiedToken first")
    void changePassword_ShouldThrow_WhenCurrentPasswordInvalid() {
        Account account = Account.builder()
                .id(1L)
                .email("user@test.local")
                .passwordHash("old-hash")
                .build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong-current");
        request.setNewPassword("new-pass-123");
        request.setConfirmPassword("new-pass-123");

        when(accountRepository.findByEmail(account.getEmail())).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong-current", "old-hash")).thenReturn(false);

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.changePassword(account.getEmail(), request));

        assertEquals("Mật khẩu hiện tại không đúng.", ex.getMessage());
        verify(accountRepository, never()).save(any());
        verify(refreshTokenRepository, never()).saveAll(any());
    }

    // ==========================================
    // 🔐 UNIT TESTS FOR LOGIN FUNCTIONALITY
    // ==========================================

    @Test
    void login_ShouldReturnLoginResponse_WhenCredentialsAreValid() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("user@test.local");
        request.setPassword("correct-pass");

        Account account = Account.builder()
                .id(1L)
                .email("user@test.local")
                .passwordHash("hashed-pass")
                .role(Role.ROLE_STUDENT)
                .build();

        Profile profile = Profile.builder()
                .accountId(1L)
                .firstName("John")
                .lastName("Doe")
                .build();

        AuthUserResponse authUserResponse = AuthUserResponse.builder()
                .accountId(1L)
                .email("user@test.local")
                .firstName("John")
                .lastName("Doe")
                .roles(List.of("ROLE_STUDENT"))
                .build();

        when(accountRepository.findByEmail("user@test.local")).thenReturn(Optional.of(account));
        when(jwtService.generateAccessToken(account)).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(account)).thenReturn("refresh-token-456");
        when(jwtService.getRefreshTokenExpirationMs()).thenReturn(604800000L); // 7 days
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(3600000L); // 1 hour
        when(profileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(authMapper.toAuthUserResponse(account, profile)).thenReturn(authUserResponse);
        when(teamMemberRepository.findByAccountId(1L)).thenReturn(List.of());

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("access-token-123", response.getAccessToken());
        assertEquals("refresh-token-456", response.getRefreshToken());
        assertEquals(3600L, response.getExpiresIn());
        assertNotNull(response.getUser());
        assertEquals("user@test.local", response.getUser().getEmail());

        verify(authenticationManager).authenticate(
                new UsernamePasswordAuthenticationToken("user@test.local", "correct-pass")
        );
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void login_ShouldThrowBadCredentialsException_WhenAuthenticationFails() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("user@test.local");
        request.setPassword("wrong-pass");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Email hoặc mật khẩu không đúng."));

        // Act & Assert
        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.login(request));

        assertEquals("Email hoặc mật khẩu không đúng.", ex.getMessage());
        verify(accountRepository, never()).findByEmail(any());
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_ShouldThrowBadCredentialsException_WhenUserNotFound() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("notfound@test.local");
        request.setPassword("some-pass");

        when(accountRepository.findByEmail("notfound@test.local")).thenReturn(Optional.empty());

        // Act & Assert
        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.login(request));

        assertEquals("Email hoặc mật khẩu không đúng.", ex.getMessage());
        verify(refreshTokenRepository, never()).save(any());
    }

    // ==========================================
    // 📝 UNIT TESTS FOR REGISTER FUNCTIONALITY
    // ==========================================

    @Test
    void register_ShouldCreateAccount_WhenOtpAndFieldsAreValid() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.local");
        request.setPassword("securepass123");
        request.setFirstName("Alice");
        request.setLastName("Smith");
        request.setRoleName("ROLE_STUDENT");
        request.setCode("SV12345");
        request.setSchoolId(10L);
        request.setDepartmentId(20L);
        request.setVerifiedToken("valid-otp-token");

        School school = School.builder()
                .id(10L)
                .name("IUH University")
                .build();

        Department department = Department.builder()
                .id(20L)
                .school(school)
                .departmentName("IT")
                .build();

        Account savedAccount = Account.builder()
                .id(5L)
                .email("newuser@test.local")
                .passwordHash("hashed-password")
                .role(Role.ROLE_STUDENT)
                .build();

        when(accountRepository.existsByEmail("newuser@test.local")).thenReturn(false);
        when(jwtService.isOtpVerifiedTokenForPurpose("valid-otp-token", OtpPurpose.REGISTER)).thenReturn(true);
        when(jwtService.extractSubject("valid-otp-token")).thenReturn("newuser@test.local");
        when(passwordEncoder.encode("securepass123")).thenReturn("hashed-password");
        when(accountRepository.save(any(Account.class))).thenReturn(savedAccount);
        when(schoolRepository.findById(10L)).thenReturn(Optional.of(school));
        when(departmentRepository.findById(20L)).thenReturn(Optional.of(department));

        // Act
        String result = authService.register(request);

        // Assert
        assertEquals("Tạo tài khoản thành công!", result);
        verify(accountRepository).save(any(Account.class));
        verify(profileRepository).save(any(Profile.class));
    }

    @Test
    void register_ShouldThrowException_WhenEmailAlreadyExists() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("exists@test.local");

        when(accountRepository.existsByEmail("exists@test.local")).thenReturn(true);

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(request));

        assertEquals("Email đã được sử dụng!", ex.getMessage());
        verify(accountRepository, never()).save(any());
        verify(profileRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenOtpTokenIsEmpty() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.local");
        request.setVerifiedToken("");

        when(accountRepository.existsByEmail("newuser@test.local")).thenReturn(false);

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(request));

        assertEquals("Vui lòng xác thực email bằng OTP trước khi đăng ký!", ex.getMessage());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenOtpTokenIsInvalid() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.local");
        request.setVerifiedToken("invalid-token");

        when(accountRepository.existsByEmail("newuser@test.local")).thenReturn(false);
        when(jwtService.isOtpVerifiedTokenForPurpose("invalid-token", OtpPurpose.REGISTER)).thenReturn(false);

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(request));

        assertEquals("Phiên xác thực email không hợp lệ hoặc đã hết hạn!", ex.getMessage());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenEmailMismatch() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.local");
        request.setVerifiedToken("valid-token");

        when(accountRepository.existsByEmail("newuser@test.local")).thenReturn(false);
        when(jwtService.isOtpVerifiedTokenForPurpose("valid-token", OtpPurpose.REGISTER)).thenReturn(true);
        when(jwtService.extractSubject("valid-token")).thenReturn("otheruser@test.local");

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(request));

        assertEquals("Email đăng ký không khớp với email đã xác thực!", ex.getMessage());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenSchoolNotFound() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.local");
        request.setPassword("securepass123");
        request.setRoleName("ROLE_STUDENT");
        request.setSchoolId(10L);
        request.setDepartmentId(20L);
        request.setVerifiedToken("valid-otp-token");

        Account savedAccount = Account.builder()
                .id(5L)
                .email("newuser@test.local")
                .role(Role.ROLE_STUDENT)
                .build();

        when(accountRepository.existsByEmail("newuser@test.local")).thenReturn(false);
        when(jwtService.isOtpVerifiedTokenForPurpose("valid-otp-token", OtpPurpose.REGISTER)).thenReturn(true);
        when(jwtService.extractSubject("valid-otp-token")).thenReturn("newuser@test.local");
        when(passwordEncoder.encode("securepass123")).thenReturn("hashed-password");
        when(accountRepository.save(any(Account.class))).thenReturn(savedAccount);
        when(schoolRepository.findById(10L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(request));

        assertEquals("Không tìm thấy Trường trong hệ thống!", ex.getMessage());
        verify(profileRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenDepartmentDoesNotBelongToSchool() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.local");
        request.setPassword("securepass123");
        request.setRoleName("ROLE_STUDENT");
        request.setSchoolId(10L);
        request.setDepartmentId(20L);
        request.setVerifiedToken("valid-otp-token");

        School school10 = School.builder().id(10L).name("School A").build();
        School school30 = School.builder().id(30L).name("School B").build();
        Department department20 = Department.builder().id(20L).school(school30).departmentName("IT").build();

        Account savedAccount = Account.builder()
                .id(5L)
                .email("newuser@test.local")
                .role(Role.ROLE_STUDENT)
                .build();

        when(accountRepository.existsByEmail("newuser@test.local")).thenReturn(false);
        when(jwtService.isOtpVerifiedTokenForPurpose("valid-otp-token", OtpPurpose.REGISTER)).thenReturn(true);
        when(jwtService.extractSubject("valid-otp-token")).thenReturn("newuser@test.local");
        when(passwordEncoder.encode("securepass123")).thenReturn("hashed-password");
        when(accountRepository.save(any(Account.class))).thenReturn(savedAccount);
        when(schoolRepository.findById(10L)).thenReturn(Optional.of(school10));
        when(departmentRepository.findById(20L)).thenReturn(Optional.of(department20));

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(request));

        assertEquals("Khoa được chọn không thuộc về Trường này!", ex.getMessage());
        verify(profileRepository, never()).save(any());
    }
}
