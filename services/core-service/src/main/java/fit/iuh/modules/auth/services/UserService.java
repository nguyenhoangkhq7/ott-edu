package fit.iuh.modules.auth.services;

import java.util.List;

import fit.iuh.modules.auth.dtos.auth.AuthUserResponse;

public interface UserService {

    List<AuthUserResponse> searchUsers(String keyword, String currentUserEmail);
}
