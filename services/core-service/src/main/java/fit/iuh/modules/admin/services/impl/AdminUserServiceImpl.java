package fit.iuh.modules.admin.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.RefreshToken;
import fit.iuh.models.Role;
import fit.iuh.models.School;
import fit.iuh.modules.admin.dtos.AdminUserResponse;
import fit.iuh.modules.admin.dtos.CreateUserRequest;
import fit.iuh.modules.admin.dtos.UpdateUserRequest;
import fit.iuh.modules.admin.dtos.UserSummaryResponse;
import fit.iuh.modules.admin.dtos.UserGrowthPoint;
import fit.iuh.modules.admin.dtos.TopActiveUser;
import fit.iuh.modules.admin.repositories.AdminUserRepository;
import fit.iuh.modules.admin.services.AdminUserService;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.RefreshTokenRepository;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.school.repositories.SchoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import fit.iuh.models.AccountStatus;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.InputStream;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(String search, String role, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        // Map role
        Role roleEnum = null;
        if (role != null && !role.equalsIgnoreCase("all")) {
            switch (role.toLowerCase()) {
                case "student":
                    roleEnum = Role.ROLE_STUDENT;
                    break;
                case "teacher":
                    roleEnum = Role.ROLE_TEACHER;
                    break;
                case "super admin":
                case "editor":
                case "viewer":
                case "admin":
                    roleEnum = Role.ROLE_ADMIN;
                    break;
            }
        }

        // Map status
        Boolean isLocked = null;
        if (status != null && !status.equalsIgnoreCase("all")) {
            if (status.equalsIgnoreCase("locked")) {
                isLocked = true;
            } else if (status.equalsIgnoreCase("active")) {
                isLocked = false;
            }
        }

        Page<Profile> profiles = adminUserRepository.findAdminUsers(search, roleEnum, isLocked, pageable);
        return profiles.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public AdminUserResponse createUser(CreateUserRequest request) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        Role roleEnum = mapFrontendRoleToBackend(request.getRole());

        Account account = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(roleEnum)
                .isEmailVerified(true)
                .isLocked(false)
                .isOnline(false)
                .build();

        account = accountRepository.save(account);

        School school = schoolRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trường nào trong hệ thống."));
        Department department = departmentRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa nào trong hệ thống."));

        Profile profile = Profile.builder()
                .accountId(account.getId())
                .account(account)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .code("USER" + account.getId())
                .school(school)
                .department(department)
                .build();

        profile = profileRepository.save(profile);

        return mapToResponse(profile);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(Long userId, UpdateUserRequest request) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại."));
        Account account = profile.getAccount();

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());

        Role roleEnum = mapFrontendRoleToBackend(request.getRole());
        account.setRole(roleEnum);
        accountRepository.save(account);

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa/phòng ban."));
            profile.setDepartment(department);
            profile.setSchool(department.getSchool());
        } else {
            profile.setDepartment(null);
        }

        profile = profileRepository.save(profile);
        return mapToResponse(profile);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        if (!accountRepository.existsById(userId)) {
            throw new RuntimeException("Tài khoản không tồn tại.");
        }
        profileRepository.deleteById(userId);
        accountRepository.deleteById(userId);
    }

    @Override
    @Transactional
    public void lockUser(Long userId) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));
        account.setLocked(true);
        accountRepository.save(account);

        // Force logout: revoke all active tokens
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountIdAndRevokedFalse(userId);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);
    }

    @Override
    @Transactional
    public void unlockUser(Long userId) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));
        account.setLocked(false);
        accountRepository.save(account);
    }

    @Override
    @Transactional
    public String resetUserPassword(Long userId) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

        String rawPassword = generateRandomPassword();
        account.setPasswordHash(passwordEncoder.encode(rawPassword));
        accountRepository.save(account);

        // Force logout: revoke all active tokens
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountIdAndRevokedFalse(userId);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);

        return rawPassword;
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getUserSummary() {
        long totalAccounts = adminUserRepository.countAllAccounts();
        long activeNow = adminUserRepository.countActiveAccounts();
        long lockedAccounts = adminUserRepository.countLockedAccounts();

        return UserSummaryResponse.builder()
                .totalAccounts(totalAccounts)
                .activeNow(activeNow)
                .lockedAccounts(lockedAccounts)
                .build();
    }

    private AdminUserResponse mapToResponse(Profile profile) {
        Account account = profile.getAccount();
        return AdminUserResponse.builder()
                .accountId(profile.getAccountId())
                .username(extractUsername(account.getEmail()))
                .email(account.getEmail())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .role(mapBackendRoleToFrontend(account.getRole()))
                .status(account.isLocked() ? "Locked" : "Active")
                .createdDate(formatDateTime(account.getCreatedAt()))
                .avatarUrl(profile.getAvatarUrl())
                .schoolId(profile.getSchool() != null ? profile.getSchool().getId() : null)
                .schoolName(profile.getSchool() != null ? profile.getSchool().getName() : null)
                .departmentId(profile.getDepartment() != null ? profile.getDepartment().getId() : null)
                .departmentName(profile.getDepartment() != null ? profile.getDepartment().getDepartmentName() : null)
                .build();
    }

    private String extractUsername(String email) {
        if (email == null) return "";
        int index = email.indexOf('@');
        return index > 0 ? email.substring(0, index) : email;
    }

    private String mapBackendRoleToFrontend(Role role) {
        if (role == null) return "Student";
        switch (role) {
            case ROLE_ADMIN:
                return "Super Admin";
            case ROLE_TEACHER:
                return "Teacher";
            case ROLE_STUDENT:
            default:
                return "Student";
        }
    }

    private Role mapFrontendRoleToBackend(String role) {
        if (role == null) return Role.ROLE_STUDENT;
        switch (role.trim().toLowerCase()) {
            case "teacher":
            case "role_teacher":
                return Role.ROLE_TEACHER;
            case "super admin":
            case "admin":
            case "role_admin":
            case "editor":
            case "viewer":
                return Role.ROLE_ADMIN;
            case "student":
            case "role_student":
            default:
                return Role.ROLE_STUDENT;
        }
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH);
        return dateTime.format(formatter);
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString() + "@2026";
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserGrowthPoint> getUserGrowthStats() {
        List<UserGrowthPoint> points = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Calculate cumulative users for the last 6 months
        for (int i = 5; i >= 0; i--) {
            LocalDateTime targetMonthEnd = now.minusMonths(i)
                    .with(java.time.temporal.TemporalAdjusters.lastDayOfMonth())
                    .withHour(23).withMinute(59).withSecond(59);
            long count = adminUserRepository.countAccountsBefore(targetMonthEnd);

            String monthName = targetMonthEnd.format(DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH));
            points.add(UserGrowthPoint.builder()
                    .month(monthName)
                    .count(count)
                    .build());
        }
        return points;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopActiveUser> getTopActiveUsers() {
        // 1. Group message count by senderId and look up their email in chat DB
        List<org.bson.Document> results = mongoTemplate.getCollection("messages")
                .aggregate(List.of(
                        new org.bson.Document("$group", new org.bson.Document("_id", "$senderId").append("count", new org.bson.Document("$sum", 1))),
                        new org.bson.Document("$lookup", new org.bson.Document("from", "users").append("localField", "_id").append("foreignField", "_id").append("as", "user")),
                        new org.bson.Document("$unwind", "$user"),
                        new org.bson.Document("$project", new org.bson.Document("email", "$user.email").append("count", 1))
                )).into(new ArrayList<>());

        List<TopActiveUser> activeUsers = new ArrayList<>();

        // 2. Map MongoDB stats to SQL accounts
        for (org.bson.Document doc : results) {
            String email = doc.getString("email");
            Integer countVal = doc.getInteger("count");
            int count = countVal != null ? countVal : 0;

            if (email != null) {
                profileRepository.findByAccount_Email(email).ifPresent(profile -> {
                    Account account = profile.getAccount();
                    String fullName = profile.getFirstName() + " " + profile.getLastName();
                    int engagement = Math.min(100, count * 5); // 5% engagement per message

                    activeUsers.add(TopActiveUser.builder()
                            .accountId(profile.getAccountId())
                            .name(fullName)
                            .email(email)
                            .avatarUrl(profile.getAvatarUrl())
                            .lastActivity(account.isOnline() ? "Active now" : "Offline")
                            .messages(count)
                            .engagement(engagement)
                            .build());
                });
            }
        }

        // Sort by message count descending
        activeUsers.sort((u1, u2) -> Integer.compare(u2.getMessages(), u1.getMessages()));

        // Fallback: If MongoDB has no message logs (or in early development), show existing users with mock/simulated stats
        if (activeUsers.isEmpty()) {
            List<Profile> allProfiles = profileRepository.findAll();
            for (int i = 0; i < Math.min(5, allProfiles.size()); i++) {
                Profile profile = allProfiles.get(i);
                Account account = profile.getAccount();
                String fullName = profile.getFirstName() + " " + profile.getLastName();
                
                activeUsers.add(TopActiveUser.builder()
                        .accountId(profile.getAccountId())
                        .name(fullName)
                        .email(account.getEmail())
                        .avatarUrl(profile.getAvatarUrl())
                        .lastActivity(account.isOnline() ? "Active now" : "Offline")
                        .messages(15 + i * 8)
                        .engagement(30 + i * 12)
                        .build());
            }
        }

        // Limit to top 5
        return activeUsers.subList(0, Math.min(5, activeUsers.size()));
    }

    @Override
    @Transactional
    public void importUsersFromExcel(MultipartFile file) {
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell emailCell = row.getCell(0);
                Cell firstNameCell = row.getCell(1);
                Cell lastNameCell = row.getCell(2);
                Cell roleCell = row.getCell(3);
                Cell codeCell = row.getCell(4);
                Cell schoolNameCell = row.getCell(5);
                Cell departmentNameCell = row.getCell(6);

                String email = getCellValue(emailCell).trim();
                if (email.isEmpty()) {
                    continue;
                }

                if (accountRepository.existsByEmail(email)) {
                    log.warn("Email đã tồn tại, bỏ qua dòng {}: {}", i, email);
                    continue; // Skip existing email
                }

                String firstName = getCellValue(firstNameCell).trim();
                String lastName = getCellValue(lastNameCell).trim();
                String roleStr = getCellValue(roleCell).trim();
                String code = getCellValue(codeCell).trim();
                String schoolName = getCellValue(schoolNameCell).trim();
                String departmentName = getCellValue(departmentNameCell).trim();

                Role roleEnum = mapFrontendRoleToBackend(roleStr);

                Account account = Account.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode("12345678"))
                        .role(roleEnum)
                        .isEmailVerified(true)
                        .status(AccountStatus.AVAILABLE)
                        .isLocked(false)
                        .isOnline(false)
                        .build();

                account = accountRepository.save(account);

                if (code.isEmpty()) {
                    code = "USER" + account.getId();
                }

                School foundSchool = null;
                if (!schoolName.isEmpty()) {
                    foundSchool = schoolRepository.findFirstByNameContainingIgnoreCase(schoolName).orElse(null);
                    if (foundSchool == null) {
                        log.warn("Could not find School for name: {}", schoolName);
                    }
                }

                Department foundDepartment = null;
                if (!departmentName.isEmpty()) {
                    foundDepartment = departmentRepository.findFirstByDepartmentNameContainingIgnoreCase(departmentName).orElse(null);
                    if (foundDepartment == null) {
                        log.warn("Could not find Department for name: {}", departmentName);
                    }
                }

                Profile profile = Profile.builder()
                        .account(account)
                        .firstName(firstName)
                        .lastName(lastName)
                        .code(code)
                        .school(foundSchool)
                        .department(foundDepartment)
                        .build();

                entityManager.persist(profile);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi nhập tài khoản từ Excel: " + e.getMessage(), e);
        }
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                double numericValue = cell.getNumericCellValue();
                if (numericValue == (long) numericValue) {
                    return String.format("%d", (long) numericValue);
                } else {
                    return String.format("%s", numericValue);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default:
                return cell.toString();
        }
    }
}
