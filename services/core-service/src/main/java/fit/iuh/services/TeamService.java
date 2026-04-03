package fit.iuh.services;

import fit.iuh.dtos.team.CreateTeamRequest;
import fit.iuh.dtos.team.TeamResponse;

import java.util.List;

public interface TeamService {

    /**
     * Tạo lớp học mới. Người gọi API sẽ tự động trở thành TEACHER của lớp.
     *
     * @param request thông tin lớp học cần tạo
     * @param email   email của người dùng đang đăng nhập (từ JWT)
     * @return thông tin lớp học vừa được tạo
     */
    TeamResponse createTeam(CreateTeamRequest request, String email);

    /**
     * Lấy danh sách tất cả lớp học mà người dùng hiện tại là thành viên.
     *
     * @param email email của người dùng đang đăng nhập (từ JWT)
     * @return danh sách lớp học
     */
    List<TeamResponse> getMyTeams(String email);

    /**
     * Cập nhật thông tin lớp học. Chỉ có TEACHER mới được phép.
     *
     * @param teamId  Id của lớp học cần cập nhật
     * @param request dữ liệu cần cập nhật
     * @param email   email của người thực hiện
     * @return thông tin lớp học sau khi cập nhật
     */
    TeamResponse updateTeam(Long teamId, fit.iuh.dtos.team.UpdateTeamRequest request, String email);

    TeamResponse getTeamById(Long teamId, String email);

    /**
     * Lấy danh sách tất cả thành viên trong lớp học.
     * Chỉ thành viên của lớp học mới có quyền xem danh sách này.
     *
     * @param teamId Id của lớp học cần lấy danh sách thành viên
     * @param email  email của người yêu cầu
     * @return danh sách thông tin thành viên
     */
    java.util.List<fit.iuh.dtos.team.TeamMemberResponse> getTeamMembers(Long teamId, String email);
}
