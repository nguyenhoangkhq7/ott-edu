package fit.iuh.modules.auth.controllers;

import fit.iuh.models.Profile;
import fit.iuh.modules.auth.dtos.auth.ProfileResponseDto;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileRepository profileRepository;

    @GetMapping("/by-accounts")
    public ResponseEntity<ApiSuccessResponse<List<ProfileResponseDto>>> getProfilesByAccounts(
            @RequestParam("ids") List<Long> ids) {
        List<Profile> profiles = profileRepository.findAllById(ids);
        List<ProfileResponseDto> response = profiles.stream()
                .map(p -> {
                    String fName = p.getFirstName() != null ? p.getFirstName() : "";
                    String lName = p.getLastName() != null ? p.getLastName() : "";
                    String fullName = (fName + " " + lName).trim();
                    return ProfileResponseDto.builder()
                            .accountId(p.getAccountId())
                            .fullName(fullName)
                            .code(p.getCode())
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                ApiResponseFactory.success(HttpStatus.OK, "Lấy thông tin profile thành công.", response)
        );
    }
}
