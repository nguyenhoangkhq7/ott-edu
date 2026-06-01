package fit.iuh.modules.auth.services.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import fit.iuh.models.Profile;
import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.auth.services.UserService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final ProfileRepository profileRepository;

    @Override
    public List<AuthUserResponse> searchUsers(String keyword, String currentUserEmail) {
        // Tìm profile của chính ông để lấy DeptID và AccountID
        Profile myProfile = profileRepository.findByAccount_Email(currentUserEmail).orElse(null);

        List<Profile> profiles;

        if (keyword != null && !keyword.trim().isEmpty()) {
            // Nếu có gõ tìm kiếm -> Tìm rộng rãi (nhưng vẫn lọc Admin)
            profiles = profileRepository.searchProfilesExcludingSelf(keyword.trim(), currentUserEmail);
        } else {
            // Nếu gõ rỗng -> Chỉ gợi ý người quen (Cùng khoa hoặc cùng team)
            if (myProfile != null) {
                profiles = profileRepository.findRelevantUsers(currentUserEmail);
            } else {
                profiles = List.of();
            }
        }

        // Map sang DTO trả về cho Frontend
        return profiles.stream()
                .limit(20) // Trả về tối đa 20 người cho nhẹ UI
                .map(p -> {
                    String fName = p.getFirstName() != null ? p.getFirstName() : "";
                    String lName = p.getLastName() != null ? p.getLastName() : "";
                    String fullName = (fName + " " + lName).trim();

                    return AuthUserResponse.builder()
                            .id(p.getAccount().getId())
                            .fullName(fullName)
                            .accountId(p.getAccount().getId())
                            .firstName(p.getFirstName())
                            .lastName(p.getLastName())
                            .email(p.getAccount().getEmail())
                            .code(p.getCode())
                            .avatarUrl(p.getAvatarUrl())
                            .build();
                }).collect(Collectors.toList());
    }
}
