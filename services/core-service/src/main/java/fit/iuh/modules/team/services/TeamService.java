package fit.iuh.modules.team.services;

import fit.iuh.modules.team.dtos.AddTeamMemberRequest;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.dtos.UpdateTeamStatusRequest;

import java.util.List;

public interface TeamService {
    TeamResponse createTeam(TeamRequest request);

    TeamResponse getTeamById(Long teamId);

    List<TeamResponse> getAllTeams();

    List<TeamResponse> getTeamsByDepartmentId(Long departmentId);

    TeamResponse updateTeam(Long teamId, TeamRequest request);

    void deleteTeam(Long teamId);

    TeamResponse getTeamByJoinCode(String joinCode);

    List<TeamMemberResponse> getTeamMembers(Long teamId);

    TeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request);

    TeamResponse updateTeamStatus(Long teamId, UpdateTeamStatusRequest request);
}
