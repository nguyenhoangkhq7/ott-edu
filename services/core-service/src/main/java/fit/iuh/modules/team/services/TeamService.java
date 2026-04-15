package fit.iuh.modules.team.services;

import fit.iuh.modules.team.dtos.AddTeamMemberRequest;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.dtos.UpdateTeamStatusRequest;

import java.util.List;

public interface TeamService {
    TeamResponse createTeam(TeamRequest request, String creatorEmail);

    TeamResponse getTeamById(Long teamId, String requesterEmail);

    List<TeamResponse> getAllTeams(String requesterEmail);

    List<TeamResponse> getTeamsByDepartmentId(Long departmentId, String requesterEmail);

    TeamResponse updateTeam(Long teamId, TeamRequest request, String requesterEmail);

    void deleteTeam(Long teamId, String requesterEmail);

    void deleteTeamMember(Long teamId, Long memberId, String requesterEmail);

    TeamResponse getTeamByJoinCode(String joinCode);

    List<TeamMemberResponse> getTeamMembers(Long teamId, String requesterEmail);

    TeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request, String requesterEmail);

    TeamResponse updateTeamStatus(Long teamId, UpdateTeamStatusRequest request, String requesterEmail);
}
