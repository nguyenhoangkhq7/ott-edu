package fit.iuh.modules.team.services.impl;

import fit.iuh.models.Department;
import fit.iuh.models.Team;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.mappers.TeamMapper;
import fit.iuh.modules.team.repositories.TeamRepository;
import fit.iuh.modules.team.services.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {
    private final TeamRepository teamRepository;
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
}
