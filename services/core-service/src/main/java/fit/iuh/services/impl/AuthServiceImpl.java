package fit.iuh.services.impl;

import fit.iuh.dtos.register.RegisterRequest;
import fit.iuh.models.*;
import fit.iuh.repositories.*;
import fit.iuh.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SchoolRepository schoolRepository;
    
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
}