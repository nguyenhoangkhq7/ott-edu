package fit.iuh.modules.admin.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.AccountStatus;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.Role;
import fit.iuh.models.School;
import fit.iuh.modules.admin.repositories.AdminUserRepository;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.repositories.RefreshTokenRepository;
import fit.iuh.modules.department.repositories.DepartmentRepository;
import fit.iuh.modules.school.repositories.SchoolRepository;
import jakarta.persistence.EntityManager;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private SchoolRepository schoolRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    @Test
    void importUsersFromExcel_Success() throws Exception {
        // 1. Generate real XSSFWorkbook in memory
        byte[] excelContent;
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Users");

            // Header Row
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("Email");
            headerRow.createCell(1).setCellValue("FirstName");
            headerRow.createCell(2).setCellValue("LastName");
            headerRow.createCell(3).setCellValue("Role");
            headerRow.createCell(4).setCellValue("Code");
            headerRow.createCell(5).setCellValue("School");
            headerRow.createCell(6).setCellValue("Department");

            // Data Row
            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("john.doe@example.com");
            dataRow.createCell(1).setCellValue("John");
            dataRow.createCell(2).setCellValue("Doe");
            dataRow.createCell(3).setCellValue("student");
            dataRow.createCell(4).setCellValue("CODE001");
            dataRow.createCell(5).setCellValue("SchoolA");
            dataRow.createCell(6).setCellValue("DeptA");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            excelContent = bos.toByteArray();
        }

        // 2. Mock MultipartFile
        MultipartFile mockMultipartFile = mock(MultipartFile.class);
        when(mockMultipartFile.getInputStream()).thenReturn(new ByteArrayInputStream(excelContent));

        // 3. Define behavior
        when(accountRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("encoded_12345678");

        Account savedAccount = Account.builder()
                .id(101L)
                .email("john.doe@example.com")
                .passwordHash("encoded_12345678")
                .role(Role.ROLE_STUDENT)
                .isEmailVerified(true)
                .status(AccountStatus.AVAILABLE)
                .isLocked(false)
                .isOnline(false)
                .build();
        when(accountRepository.save(any(Account.class))).thenReturn(savedAccount);

        School mockSchool = School.builder().id(1L).name("SchoolA").build();
        when(schoolRepository.findFirstByNameContainingIgnoreCase("SchoolA")).thenReturn(Optional.of(mockSchool));

        Department mockDepartment = Department.builder().id(2L).departmentName("DeptA").school(mockSchool).build();
        when(departmentRepository.findFirstByDepartmentNameContainingIgnoreCase("DeptA"))
                .thenReturn(Optional.of(mockDepartment));

        // 4. Call method under test
        adminUserService.importUsersFromExcel(mockMultipartFile);

        // 5. Assertions and print Expected vs Actual
        long actualAccountSaves = mockingDetails(accountRepository).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("save"))
                .count();

        long actualProfilePersists = mockingDetails(entityManager).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("persist"))
                .count();

        System.out.println(
                "✅ [importUsersFromExcel_Success] - Expected Account Save: 1 times | Actual: " + actualAccountSaves);
        System.out.println("✅ [importUsersFromExcel_Success] - Expected Profile Persist: 1 times | Actual: "
                + actualProfilePersists);

        assertEquals(1, actualAccountSaves, "Account should be saved exactly once");
        assertEquals(1, actualProfilePersists, "Profile should be persisted exactly once");

        verify(accountRepository, times(1)).save(any(Account.class));
        verify(entityManager, times(1)).persist(any(Profile.class));
    }

    @Test
    void importUsersFromExcel_SkipExistingEmail() throws Exception {
        // 1. Generate real XSSFWorkbook in memory with existing email
        byte[] excelContent;
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Users");

            // Header Row
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("Email");
            headerRow.createCell(1).setCellValue("FirstName");
            headerRow.createCell(2).setCellValue("LastName");
            headerRow.createCell(3).setCellValue("Role");
            headerRow.createCell(4).setCellValue("Code");
            headerRow.createCell(5).setCellValue("School");
            headerRow.createCell(6).setCellValue("Department");

            // Data Row
            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("existing@example.com");
            dataRow.createCell(1).setCellValue("Existing");
            dataRow.createCell(2).setCellValue("User");
            dataRow.createCell(3).setCellValue("student");
            dataRow.createCell(4).setCellValue("CODE002");
            dataRow.createCell(5).setCellValue("SchoolA");
            dataRow.createCell(6).setCellValue("DeptA");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            excelContent = bos.toByteArray();
        }

        // 2. Mock MultipartFile
        MultipartFile mockMultipartFile = mock(MultipartFile.class);
        when(mockMultipartFile.getInputStream()).thenReturn(new ByteArrayInputStream(excelContent));

        // 3. Define behavior (mock existsByEmail to return true)
        when(accountRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // 4. Call method under test
        adminUserService.importUsersFromExcel(mockMultipartFile);

        // 5. Assertions and print Expected vs Actual
        long actualAccountSaves = mockingDetails(accountRepository).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("save"))
                .count();

        long actualProfilePersists = mockingDetails(entityManager).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("persist"))
                .count();

        System.out.println("✅ [importUsersFromExcel_SkipExistingEmail] - Expected Account Save: 0 times | Actual: "
                + actualAccountSaves);
        System.out.println("✅ [importUsersFromExcel_SkipExistingEmail] - Expected Profile Persist: 0 times | Actual: "
                + actualProfilePersists);

        assertEquals(0, actualAccountSaves, "No accounts should be saved when email already exists");
        assertEquals(0, actualProfilePersists, "No profiles should be persisted when email already exists");

        verify(accountRepository, never()).save(any(Account.class));
        verify(entityManager, never()).persist(any(Profile.class));
    }

    @Test
    void importUsersFromExcel_ThrowsException() throws Exception {
        // 1. Mock MultipartFile to throw IOException on getInputStream
        MultipartFile mockMultipartFile = mock(MultipartFile.class);
        when(mockMultipartFile.getInputStream()).thenThrow(new IOException("Disk read error"));

        // 2. Call method under test and catch exception
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            adminUserService.importUsersFromExcel(mockMultipartFile);
        });

        // 3. Assertions and print Expected vs Actual
        String expectedMessageContains = "Lỗi khi nhập tài khoản từ Excel";
        String actualMessage = exception.getMessage();

        System.out.println("✅ [importUsersFromExcel_ThrowsException] - Expected message to contain: '"
                + expectedMessageContains + "' | Actual message: '" + actualMessage + "'");

        assertNotNull(actualMessage, "Exception message should not be null");
        assertTrue(actualMessage.contains(expectedMessageContains), "Exception message should contain explanation");
        assertTrue(actualMessage.contains("Disk read error"), "Exception message should contain root cause details");
    }
}
