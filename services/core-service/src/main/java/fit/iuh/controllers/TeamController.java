package fit.iuh.controllers;

import fit.iuh.dtos.team.CreateTeamRequest;
import fit.iuh.dtos.team.TeamResponse;
import fit.iuh.services.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    /**
     * POST /teams
     * Tạo lớp học mới. Người dùng đang đăng nhập sẽ tự động trở thành TEACHER.
     * Yêu cầu: đã xác thực (JWT).
     */
    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @RequestBody CreateTeamRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        TeamResponse response = teamService.createTeam(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /teams/my
     * Lấy danh sách lớp học mà người dùng hiện tại là thành viên.
     * Yêu cầu: đã xác thực (JWT).
     */
    @GetMapping("/my")
    public ResponseEntity<List<TeamResponse>> getMyTeams(Authentication authentication) {
        String email = authentication.getName();
        List<TeamResponse> teams = teamService.getMyTeams(email);
        return ResponseEntity.ok(teams);
    }

    /**
     * PUT /teams/{id}
     * Cập nhật lớp học. Yêu cầu người dùng hiện tại là TEACHER của lớp.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Long id,
            @RequestBody fit.iuh.dtos.team.UpdateTeamRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        TeamResponse response = teamService.updateTeam(id, request, email);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /teams/{id}
     * Lấy thông tin chi tiết của 1 lớp học.
     * Yêu cầu: người dùng phải là thành viên của lớp.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getTeam(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        TeamResponse response = teamService.getTeamById(id, email);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /teams/{id}/members
     * Lấy danh sách thành viên của lớp học.
     */
    @GetMapping("/{id}/members")
    public ResponseEntity<java.util.List<fit.iuh.dtos.team.TeamMemberResponse>> getMembers(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        java.util.List<fit.iuh.dtos.team.TeamMemberResponse> members = teamService.getTeamMembers(id, email);
        return ResponseEntity.ok(members);
    }
}
