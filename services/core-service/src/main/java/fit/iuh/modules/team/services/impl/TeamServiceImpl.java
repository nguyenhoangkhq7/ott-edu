package fit.iuh.modules.team.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.Team;
import fit.iuh.models.TeamMember;
import fit.iuh.models.TeamMemberRole;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.team.integration.ChatConversationSyncService;
import fit.iuh.modules.team.dtos.AddTeamMemberRequest;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.dtos.UpdateTeamStatusRequest;
import fit.iuh.modules.team.mappers.TeamMapper;
import fit.iuh.modules.team.repositories.TeamMemberRepository;
import fit.iuh.modules.team.repositories.TeamRepository;
import fit.iuh.modules.team.services.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamServiceImpl implements TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProfileRepository profileRepository;
    private final AccountRepository accountRepository;
    private final TeamMapper teamMapper;
    private final ChatConversationSyncService chatConversationSyncService;

    @Override
    @Transactional
    public TeamResponse createTeam(TeamRequest request, String creatorEmail) {
        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .joinCode(request.getJoinCode())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .department(Department.builder().id(request.getDepartmentId()).build())
                .build();

        Team savedTeam = teamRepository.save(team);
        Account creatorAccount = accountRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Account not found with email: " + creatorEmail));

        TeamMember creatorMember = TeamMember.builder()
                .account(creatorAccount)
                .team(savedTeam)
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(creatorMember);

        Team syncedTeam = teamRepository.findById(savedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + savedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(savedTeam.getId()));

        return teamMapper.toResponse(syncedTeam);
    }

    @Override
    public TeamResponse getTeamById(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        return teamMapper.toResponse(team);
    }

    @Override
    public List<TeamResponse> getAllTeams() {
        return teamMapper.toResponseList(teamRepository.findAll());
    }

    @Override
    public List<TeamResponse> getTeamsByDepartmentId(Long departmentId) {
        return teamMapper.toResponseList(teamRepository.findByDepartmentId(departmentId));
    }

    @Override
    @Transactional
    public TeamResponse updateTeam(Long teamId, TeamRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setJoinCode(request.getJoinCode());
        team.setDepartment(Department.builder().id(request.getDepartmentId()).build());

        Team updatedTeam = teamRepository.save(team);
        Team syncedTeam = teamRepository.findById(updatedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + updatedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(updatedTeam.getId()));
        return teamMapper.toResponse(syncedTeam);
    }

    @Override
    @Transactional
    public void deleteTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setActive(false);
        team.setDeletedAt(LocalDateTime.now());
        Team deletedTeam = teamRepository.save(team);
        Team syncedTeam = teamRepository.findById(deletedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + deletedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                true,
                teamMemberRepository.findAllByTeamId(deletedTeam.getId()));
    }

    @Override
    public TeamResponse getTeamByJoinCode(String joinCode) {
        Team team = teamRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new RuntimeException("Team not found with joinCode: " + joinCode));
        return teamMapper.toResponse(team);
    }

    @Override
    public List<TeamMemberResponse> getTeamMembers(Long teamId) {
        // Verify team exists
        teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        List<TeamMember> members = teamMemberRepository.findAllByTeamId(teamId);

        return members.stream()
                .map(member -> {
                    Profile profile = profileRepository.findById(member.getAccount().getId()).orElse(null);
                    String firstName = profile != null ? profile.getFirstName() : "";
                    String lastName = profile != null ? profile.getLastName() : "";

                    return TeamMemberResponse.builder()
                            .id(member.getId())
                            .accountId(member.getAccount().getId())
                            .email(member.getAccount().getEmail())
                            .firstName(firstName)
                            .lastName(lastName)
                            .role(member.getRole().name())
                            .joinedAt(member.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + request.getAccountId()));

        if (teamMemberRepository.findByTeamIdAndAccountId(teamId, account.getId()).isPresent()) {
            throw new RuntimeException("Account already exists in team: " + teamId);
        }

        TeamMember newMember = TeamMember.builder()
                .account(account)
                .team(team)
                .role(TeamMemberRole.valueOf(request.getRole()))
                .joinedAt(java.time.LocalDateTime.now())
                .build();

        newMember = teamMemberRepository.save(newMember);

        Profile profile = profileRepository.findById(account.getId()).orElse(null);
        String firstName = profile != null ? profile.getFirstName() : "";
        String lastName = profile != null ? profile.getLastName() : "";

        Team syncedTeam = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(teamId));

        return TeamMemberResponse.builder()
                .id(newMember.getId())
                .accountId(newMember.getAccount().getId())
                .email(newMember.getAccount().getEmail())
                .firstName(firstName)
                .lastName(lastName)
                .role(newMember.getRole().name())
                .joinedAt(newMember.getJoinedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteTeamMember(Long teamId, Long memberId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        TeamMember member = teamMemberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Team member not found with id: " + memberId));

        if (!member.getTeam().getId().equals(team.getId())) {
            throw new RuntimeException("Team member does not belong to team: " + teamId);
        }

        teamMemberRepository.delete(member);

        Team syncedTeam = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(teamId));
    }

    @Override
    @Transactional
    public TeamResponse updateTeamStatus(Long teamId, UpdateTeamStatusRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setActive(request.isActive());
        Team updatedTeam = teamRepository.save(team);
        Team syncedTeam = teamRepository.findById(updatedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + updatedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(updatedTeam.getId()));
        return teamMapper.toResponse(syncedTeam);
    }
}
