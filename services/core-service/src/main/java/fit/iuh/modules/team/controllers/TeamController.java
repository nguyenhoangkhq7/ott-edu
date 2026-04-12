package fit.iuh.modules.team.controllers;

import fit.iuh.modules.platform.api.ApiResponseFactory;
import fit.iuh.modules.platform.api.ApiSuccessResponse;
import fit.iuh.modules.team.dtos.AddTeamMemberRequest;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.dtos.UpdateTeamStatusRequest;
import fit.iuh.modules.team.services.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ApiSuccessResponse<TeamResponse>> createTeam(
        Authentication authentication,
            @RequestBody TeamRequest request) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Không tìm thấy thông tin người dùng đăng nhập.");
        }

        TeamResponse response = teamService.createTeam(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseFactory.success(
                        HttpStatus.CREATED,
                        "Tạo lớp học thành công.",
                        response));
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<ApiSuccessResponse<TeamResponse>> getTeamById(@PathVariable Long teamId) {
        TeamResponse response = teamService.getTeamById(teamId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Lấy thông tin lớp học thành công.",
                        response));
    }

    @GetMapping
    public ResponseEntity<ApiSuccessResponse<List<TeamResponse>>> getAllTeams() {
        List<TeamResponse> response = teamService.getAllTeams();
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Lấy danh sách lớp học thành công.",
                        response));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiSuccessResponse<List<TeamResponse>>> getTeamsByDepartmentId(
            @PathVariable Long departmentId) {
        List<TeamResponse> response = teamService.getTeamsByDepartmentId(departmentId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Lấy danh sách lớp học theo khoa thành công.",
                        response));
    }

    @PutMapping("/{teamId}")
    public ResponseEntity<ApiSuccessResponse<TeamResponse>> updateTeam(
            @PathVariable Long teamId,
            @RequestBody TeamRequest request) {
        TeamResponse response = teamService.updateTeam(teamId, request);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Cập nhật lớp học thành công.",
                        response));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<ApiSuccessResponse<String>> deleteTeam(@PathVariable Long teamId) {
        teamService.deleteTeam(teamId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Xóa lớp học thành công.",
                        null));
    }

    @GetMapping("/join-code/{joinCode}")
    public ResponseEntity<ApiSuccessResponse<TeamResponse>> getTeamByJoinCode(
            @PathVariable String joinCode) {
        TeamResponse response = teamService.getTeamByJoinCode(joinCode);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Lấy lớp học theo mã tham gia thành công.",
                        response));
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<ApiSuccessResponse<java.util.List<TeamMemberResponse>>> getTeamMembers(
            @PathVariable Long teamId) {
        java.util.List<TeamMemberResponse> response = teamService.getTeamMembers(teamId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Lấy danh sách thành viên lớp học thành công.",
                        response));
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<ApiSuccessResponse<TeamMemberResponse>> addTeamMember(
            @PathVariable Long teamId,
            @RequestBody AddTeamMemberRequest request) {
        TeamMemberResponse response = teamService.addTeamMember(teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseFactory.success(
                        HttpStatus.CREATED,
                        "Thêm thành viên vào lớp học thành công.",
                        response));
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<ApiSuccessResponse<String>> deleteTeamMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId) {
        teamService.deleteTeamMember(teamId, memberId);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Xóa thành viên khỏi lớp học thành công.",
                        null));
    }

    @PatchMapping("/{teamId}/status")
    public ResponseEntity<ApiSuccessResponse<TeamResponse>> updateTeamStatus(
            @PathVariable Long teamId,
            @RequestBody UpdateTeamStatusRequest request) {
        TeamResponse response = teamService.updateTeamStatus(teamId, request);
        return ResponseEntity.ok(
                ApiResponseFactory.success(
                        HttpStatus.OK,
                        "Cập nhật trạng thái lớp học thành công.",
                        response));
    }
}
