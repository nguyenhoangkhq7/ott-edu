package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Profile;
import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void searchUsers_WithKeyword_Success() {
        Account account = Account.builder().id(2L).email("john@example.com").build();
        Profile profile = Profile.builder()
                .accountId(2L)
                .firstName("John")
                .lastName("Doe")
                .code("STD01")
                .avatarUrl("avatar-doe")
                .account(account)
                .build();

        when(profileRepository.searchProfilesExcludingSelf("john", "user@example.com"))
                .thenReturn(List.of(profile));
        when(profileRepository.findByAccount_Email("user@example.com"))
                .thenReturn(Optional.of(Profile.builder().build()));

        List<AuthUserResponse> result = userService.searchUsers("john", "user@example.com");

        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected List Size: 1 | Actual: " + result.size());
        assertEquals(1, result.size());
        AuthUserResponse response = result.get(0);
        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected ID: 2 | Actual: " + response.getId());
        assertEquals(2L, response.getId());
        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected Full Name: John Doe | Actual: " + response.getFullName());
        assertEquals("John Doe", response.getFullName());
        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected Code: STD01 | Actual: " + response.getCode());
        assertEquals("STD01", response.getCode());
        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected Avatar URL: avatar-doe | Actual: " + response.getAvatarUrl());
        assertEquals("avatar-doe", response.getAvatarUrl());
        System.out.println("✅ [searchUsers_WithKeyword_Success] - Expected Email: john@example.com | Actual: " + response.getEmail());
        assertEquals("john@example.com", response.getEmail());

        verify(profileRepository).searchProfilesExcludingSelf("john", "user@example.com");
        verify(profileRepository, never()).findRelevantUsers(anyString());
    }

    @Test
    void searchUsers_EmptyKeyword_ProfileExists_Success() {
        Profile myProfile = Profile.builder().accountId(1L).build();
        Account targetAccount = Account.builder().id(3L).email("jane@example.com").build();
        Profile targetProfile = Profile.builder()
                .accountId(3L)
                .firstName("Jane")
                .lastName("")
                .code("STD02")
                .account(targetAccount)
                .build();

        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.of(myProfile));
        when(profileRepository.findRelevantUsers("user@example.com")).thenReturn(List.of(targetProfile));

        List<AuthUserResponse> result = userService.searchUsers("", "user@example.com");

        System.out.println("✅ [searchUsers_EmptyKeyword_ProfileExists_Success] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [searchUsers_EmptyKeyword_ProfileExists_Success] - Expected List Size: 1 | Actual: " + result.size());
        assertEquals(1, result.size());
        System.out.println("✅ [searchUsers_EmptyKeyword_ProfileExists_Success] - Expected Full Name: Jane | Actual: " + result.get(0).getFullName());
        assertEquals("Jane", result.get(0).getFullName());
        verify(profileRepository).findRelevantUsers("user@example.com");
        verify(profileRepository, never()).searchProfilesExcludingSelf(anyString(), anyString());
    }

    @Test
    void searchUsers_NullKeyword_ProfileNotExists_ReturnsEmpty() {
        when(profileRepository.findByAccount_Email("user@example.com")).thenReturn(Optional.empty());

        List<AuthUserResponse> result = userService.searchUsers(null, "user@example.com");

        System.out.println("✅ [searchUsers_NullKeyword_ProfileNotExists_ReturnsEmpty] - Expected result: not null | Actual result: " + result);
        assertNotNull(result);
        System.out.println("✅ [searchUsers_NullKeyword_ProfileNotExists_ReturnsEmpty] - Expected List to be empty | Actual size: " + result.size());
        assertTrue(result.isEmpty());
        verify(profileRepository, never()).findRelevantUsers(anyString());
        verify(profileRepository, never()).searchProfilesExcludingSelf(anyString(), anyString());
    }
}
