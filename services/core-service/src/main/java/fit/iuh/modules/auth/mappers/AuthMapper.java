package fit.iuh.modules.auth.mappers;

import fit.iuh.models.Account;
import fit.iuh.models.Profile;
import fit.iuh.models.Role;
import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AuthMapper {
    @Mapping(target = "accountId", source = "account.id")
    @Mapping(target = "email", source = "account.email")
    @Mapping(target = "status", source = "account.status")
    @Mapping(target = "roles", source = "account.role", qualifiedByName = "mapRoleToList")
    @Mapping(target = "firstName", source = "profile.firstName")
    @Mapping(target = "lastName", source = "profile.lastName")
    @Mapping(target = "avatarUrl", source = "profile.avatarUrl")
    @Mapping(target = "bio", source = "profile.bio")
    @Mapping(target = "phone", source = "profile.phone")
    @Mapping(target = "code", source = "profile.code")
    @Mapping(target = "schoolId", source = "profile.school.id")
    @Mapping(target = "departmentId", source = "profile.department.id")
    @Mapping(target = "departmentName", source = "profile.department.departmentName")
    AuthUserResponse toAuthUserResponse(Account account, Profile profile);

    @Named("mapRoleToList")
    default List<String> mapRoleToList(Role role) {
        if (role == null) {
            return List.of();
        }

        return List.of(role.name());
    }
}
