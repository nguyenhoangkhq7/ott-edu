package fit.iuh.modules.team.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.Team;
import fit.iuh.models.TeamMember;
import fit.iuh.models.TeamMemberRole;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.integration.ChatConversationSyncService;
import fit.iuh.modules.team.mappers.TeamMapper;
import fit.iuh.modules.team.repositories.TeamJoinRequestRepository;
import fit.iuh.modules.team.repositories.TeamMemberRepository;
import fit.iuh.modules.team.repositories.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceImplTest {

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TeamJoinRequestRepository teamJoinRequestRepository;

    @Mock
    private TeamMapper teamMapper;

    @Mock
    private ChatConversationSyncService chatConversationSyncService;

    @InjectMocks
    private TeamServiceImpl teamService;

    private Account mockAccount;
    private Team mockTeam;
    private TeamMember mockLeader;
    private String creatorEmail = "admin@example.com";

    @BeforeEach
    void setUp() {
        mockAccount = new Account();
        mockAccount.setId(1L);
        mockAccount.setEmail(creatorEmail);

        mockTeam = Team.builder()
                .id(100L)
                .name("Lớp Toán Cao Cấp")
                .description("Mô tả lớp học")
                .joinCode("JOIN123")
                .isActive(true)
                .isApprovalRequired(false)
                .department(Department.builder().id(1L).build())
                .build();

        mockLeader = TeamMember.builder()
                .id(1L)
                .account(mockAccount)
                .team(mockTeam)
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build();
    }

    // ==========================================
    // 1. TEST TẠO LỚP HỌC (createTeam)
    // ==========================================
    @Test
    void createTeam_Success() {
        // Arrange
        TeamRequest request = new TeamRequest();
        request.setName("Lớp Toán Cao Cấp");
        request.setDescription("Mô tả lớp học");
        request.setJoinCode("JOIN123");
        request.setDepartmentId(1L);
        request.setIsApprovalRequired(false);

        when(teamRepository.save(any(Team.class))).thenReturn(mockTeam);
        when(accountRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(mockAccount));
        when(teamRepository.findById(mockTeam.getId())).thenReturn(Optional.of(mockTeam));
        
        TeamResponse expectedResponse = new TeamResponse();
        expectedResponse.setId(100L);
        expectedResponse.setName("Lớp Toán Cao Cấp");
        when(teamMapper.toResponse(any(Team.class))).thenReturn(expectedResponse);

        // Act
        TeamResponse response = teamService.createTeam(request, creatorEmail);

        // Assert
        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Lớp Toán Cao Cấp", response.getName());

        verify(teamRepository, times(1)).save(any(Team.class));
        verify(teamMemberRepository, times(1)).save(any(TeamMember.class));
        verify(chatConversationSyncService, times(1)).syncClassConversation(eq(mockTeam), anyBoolean(), anyList());
    }

    @Test
    void createTeam_AccountNotFound_ShouldThrowException() {
        // Arrange
        TeamRequest request = new TeamRequest();
        when(teamRepository.save(any(Team.class))).thenReturn(mockTeam);
        when(accountRepository.findByEmail(creatorEmail)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.createTeam(request, creatorEmail);
        });
        assertTrue(exception.getMessage().contains("Account not found"));
    }

    // ==========================================
    // 2. TEST CHỈNH SỬA LỚP HỌC (updateTeam)
    // ==========================================
    @Test
    void updateTeam_Success() {
        // Arrange
        TeamRequest request = new TeamRequest();
        request.setName("Lớp Toán Cập Nhật");
        request.setDescription("Mô tả mới");
        request.setDepartmentId(2L);
        request.setIsApprovalRequired(true);

        when(accountRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(mockAccount));
        when(teamMemberRepository.findByTeamIdAndAccountId(mockTeam.getId(), mockAccount.getId()))
                .thenReturn(Optional.of(mockLeader));
        when(teamRepository.findById(mockTeam.getId())).thenReturn(Optional.of(mockTeam));
        when(teamRepository.save(any(Team.class))).thenReturn(mockTeam);

        TeamResponse expectedResponse = new TeamResponse();
        expectedResponse.setName("Lớp Toán Cập Nhật");
        when(teamMapper.toResponse(any(Team.class))).thenReturn(expectedResponse);

        // Act
        TeamResponse response = teamService.updateTeam(mockTeam.getId(), request, creatorEmail);

        // Assert
        assertNotNull(response);
        assertEquals("Lớp Toán Cập Nhật", response.getName());
        verify(teamRepository, times(1)).save(mockTeam);
        verify(chatConversationSyncService, times(1)).syncClassConversation(eq(mockTeam), anyBoolean(), anyList());
    }

    @Test
    void updateTeam_NotLeader_ShouldThrowAccessDeniedException() {
        // Arrange
        TeamRequest request = new TeamRequest();
        TeamMember mockMember = TeamMember.builder().role(TeamMemberRole.MEMBER).build(); // Not leader

        when(accountRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(mockAccount));
        when(teamMemberRepository.findByTeamIdAndAccountId(mockTeam.getId(), mockAccount.getId()))
                .thenReturn(Optional.of(mockMember));

        // Act & Assert
        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            teamService.updateTeam(mockTeam.getId(), request, creatorEmail);
        });
        assertEquals("Chỉ trưởng lớp mới có quyền thực hiện thao tác này.", exception.getMessage());
    }

    // ==========================================
    // 3. TEST HỦY LỚP HỌC (deleteTeam)
    // ==========================================
    @Test
    void deleteTeam_Success() {
        // Arrange
        when(accountRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(mockAccount));
        when(teamMemberRepository.findByTeamIdAndAccountId(mockTeam.getId(), mockAccount.getId()))
                .thenReturn(Optional.of(mockLeader));
        when(teamRepository.findById(mockTeam.getId())).thenReturn(Optional.of(mockTeam));
        when(teamRepository.save(any(Team.class))).thenReturn(mockTeam);

        // Act
        teamService.deleteTeam(mockTeam.getId(), creatorEmail);

        // Assert
        assertFalse(mockTeam.isActive()); // Soft delete
        assertNotNull(mockTeam.getDeletedAt());
        verify(teamRepository, times(1)).save(mockTeam);
        // Kiểm tra sync conversation được gọi với isDeleted = true
        verify(chatConversationSyncService, times(1)).syncClassConversation(eq(mockTeam), eq(true), anyList());
    }

    // ==========================================
    // 4. TEST XEM DANH SÁCH THÀNH VIÊN (getTeamMembers)
    // ==========================================
    @Test
    void getTeamMembers_Success() {
        // Arrange
        when(accountRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(mockAccount));
        when(teamMemberRepository.findByTeamIdAndAccountId(mockTeam.getId(), mockAccount.getId()))
                .thenReturn(Optional.of(mockLeader));
        when(teamRepository.findById(mockTeam.getId())).thenReturn(Optional.of(mockTeam));

        Account anotherAccount = new Account();
        anotherAccount.setId(2L);
        anotherAccount.setEmail("member@example.com");

        TeamMember anotherMember = TeamMember.builder()
                .id(2L)
                .account(anotherAccount)
                .team(mockTeam)
                .role(TeamMemberRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();

        when(teamMemberRepository.findAllByTeamId(mockTeam.getId()))
                .thenReturn(Arrays.asList(mockLeader, anotherMember));

        Profile mockProfile1 = new Profile();
        mockProfile1.setFirstName("Nguyen");
        mockProfile1.setLastName("Admin");

        when(profileRepository.findById(mockAccount.getId())).thenReturn(Optional.of(mockProfile1));
        when(profileRepository.findById(anotherAccount.getId())).thenReturn(Optional.empty());

        // Act
        List<TeamMemberResponse> responses = teamService.getTeamMembers(mockTeam.getId(), creatorEmail);

        // Assert
        assertNotNull(responses);
        assertEquals(2, responses.size());
        
        // Leader
        assertEquals(mockAccount.getId(), responses.get(0).getAccountId());
        assertEquals("LEADER", responses.get(0).getRole());
        assertEquals("Nguyen", responses.get(0).getFirstName());
        
        // Member
        assertEquals(anotherAccount.getId(), responses.get(1).getAccountId());
        assertEquals("MEMBER", responses.get(1).getRole());
        assertEquals("", responses.get(1).getFirstName()); // Profile trống
    }
}
