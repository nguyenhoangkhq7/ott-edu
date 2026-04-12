package fit.iuh.modules.team.mappers;

import fit.iuh.models.Team;
import fit.iuh.models.TeamMember;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TeamMapper {
    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "isActive", source = "active")
    TeamResponse toResponse(Team team);

    List<TeamResponse> toResponseList(List<Team> teams);

    @Mapping(target = "accountId", source = "account.id")
    @Mapping(target = "email", source = "account.email")
    @Mapping(target = "firstName", ignore = true)
    @Mapping(target = "lastName", ignore = true)
    @Mapping(target = "role", source = "role")
    TeamMemberResponse toMemberResponse(TeamMember teamMember);

    List<TeamMemberResponse> toMemberResponseList(List<TeamMember> teamMembers);
}
