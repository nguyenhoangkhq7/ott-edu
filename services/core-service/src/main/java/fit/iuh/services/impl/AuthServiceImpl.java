package fit.iuh.services.impl;

import fit.iuh.dtos.register.RegisterRequest;
import fit.iuh.models.Account;
import fit.iuh.models.Profile;
import fit.iuh.models.Role;
import fit.iuh.repositories.AccountRepository;
import fit.iuh.repositories.ProfileRepository;
import fit.iuh.repositories.RoleRepository;
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

        // 4. Tạo Hồ sơ người dùng (Profile) liên kết với Account đó
        Profile newProfile = Profile.builder()
                .account(newAccount)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build();

        profileRepository.save(newProfile);

        return "Tạo tài khoản thành công!";
    }
}