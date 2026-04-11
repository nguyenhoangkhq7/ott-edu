package fit.iuh.modules.team.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.Team;
import fit.iuh.models.TeamMember;
import fit.iuh.models.TeamMemberRole;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProfileRepository profileRepository;
    private final AccountRepository accountRepository;
    private final TeamMapper teamMapper;

    @Override
    public TeamResponse createTeam(TeamRequest request) {
        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .joinCode(request.getJoinCode())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .department(Department.builder().id(request.getDepartmentId()).build())
                .build();

        Team savedTeam = teamRepository.save(team);
        return teamMapper.toResponse(savedTeam);
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
    public TeamResponse updateTeam(Long teamId, TeamRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setJoinCode(request.getJoinCode());
        team.setDepartment(Department.builder().id(request.getDepartmentId()).build());

        Team updatedTeam = teamRepository.save(team);
        return teamMapper.toResponse(updatedTeam);
    }

    @Override
    public void deleteTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setActive(false);
        team.setDeletedAt(LocalDateTime.now());
        teamRepository.save(team);
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
    public TeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + request.getAccountId()));

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
    public TeamResponse updateTeamStatus(Long teamId, UpdateTeamStatusRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setActive(request.isActive());
        Team updatedTeam = teamRepository.save(team);
        return teamMapper.toResponse(updatedTeam);
    }
}
