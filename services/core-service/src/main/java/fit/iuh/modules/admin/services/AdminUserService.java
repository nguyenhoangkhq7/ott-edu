package fit.iuh.modules.admin.services;

import fit.iuh.modules.admin.dtos.AdminUserResponse;
import fit.iuh.modules.admin.dtos.CreateUserRequest;
import fit.iuh.modules.admin.dtos.UpdateUserRequest;
import fit.iuh.modules.admin.dtos.UserSummaryResponse;
import fit.iuh.modules.admin.dtos.UserGrowthPoint;
import fit.iuh.modules.admin.dtos.TopActiveUser;
import org.springframework.data.domain.Page;
import java.util.List;

public interface AdminUserService {
    Page<AdminUserResponse> getUsers(String search, String role, String status, int page, int size);
    AdminUserResponse createUser(CreateUserRequest request);
    AdminUserResponse updateUser(Long userId, UpdateUserRequest request);
    void deleteUser(Long userId);
    void lockUser(Long userId);
    void unlockUser(Long userId);
    String resetUserPassword(Long userId);
    UserSummaryResponse getUserSummary();
    List<UserGrowthPoint> getUserGrowthStats();
    List<TopActiveUser> getTopActiveUsers();
}
