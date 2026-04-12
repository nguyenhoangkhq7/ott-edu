package fit.iuh.modules.team.services;

import fit.iuh.modules.team.dtos.AddTeamMemberRequest;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.dtos.UpdateTeamStatusRequest;

import java.util.List;

public interface TeamService {
    TeamResponse createTeam(TeamRequest request, String creatorEmail);

    TeamResponse getTeamById(Long teamId);

    List<TeamResponse> getAllTeams();

    List<TeamResponse> getTeamsByDepartmentId(Long departmentId);

    TeamResponse updateTeam(Long teamId, TeamRequest request);

    void deleteTeam(Long teamId);

    void deleteTeamMember(Long teamId, Long memberId);

    TeamResponse getTeamByJoinCode(String joinCode);

    List<TeamMemberResponse> getTeamMembers(Long teamId);

    TeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request);

    TeamResponse updateTeamStatus(Long teamId, UpdateTeamStatusRequest request);
}
