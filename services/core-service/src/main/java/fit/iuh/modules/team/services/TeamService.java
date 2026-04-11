package fit.iuh.modules.team.services;

import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;

import java.util.List;

public interface TeamService {
    TeamResponse createTeam(TeamRequest request);

    TeamResponse getTeamById(Long teamId);

    List<TeamResponse> getAllTeams();

    List<TeamResponse> getTeamsByDepartmentId(Long departmentId);

    TeamResponse updateTeam(Long teamId, TeamRequest request);

    void deleteTeam(Long teamId);

    TeamResponse getTeamByJoinCode(String joinCode);
}
