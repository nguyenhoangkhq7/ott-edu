package fit.iuh.modules.auth.services.impl;

import fit.iuh.dtos.team.CreateTeamRequest;
import fit.iuh.dtos.team.UpdateTeamRequest;
import fit.iuh.dtos.team.TeamResponse;
import fit.iuh.dtos.team.TeamMemberResponse;
import fit.iuh.models.*;
import fit.iuh.repositories.*;
import fit.iuh.services.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final AccountRepository accountRepository;
    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;
    private final ProfileRepository profileRepository;

    @Override
    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request, String email) {
        // 1. Tìm Account của người đang đăng nhập
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));

        // 2. Xác định School
        School school = null;
        if (request.getSchoolId() != null) {
            school = schoolRepository.findById(request.getSchoolId())
                    .orElseThrow(
                            () -> new RuntimeException("Không tìm thấy trường học với id: " + request.getSchoolId()));
        } else {
            // Lấy school từ profile nếu không truyền schoolId
            Profile profile = profileRepository.findById(account.getId()).orElse(null);
            if (profile != null && profile.getSchool() != null) {
                school = profile.getSchool();
            }
        }

        // 3. Xác định Department
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(
                            () -> new RuntimeException("Không tìm thấy khoa với id: " + request.getDepartmentId()));
        } else {
            // Lấy department từ profile nếu không truyền departmentId
            Profile profile = profileRepository.findById(account.getId()).orElse(null);
            if (profile != null && profile.getDepartment() != null) {
                department = profile.getDepartment();
            }
        }

        // 4. Validate tên lớp
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Tên lớp học không được để trống.");
        }

        // 5. Generate joinCode unique
        String joinCode = generateUniqueJoinCode();

        // 6. Tạo và lưu Team
        Team team = Team.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .joinCode(joinCode)
                .school(school)
                .department(department)
                .build();
        team = teamRepository.save(team);

        // 7. Thêm người tạo vào lớp với vai trò LEADER (Giáo viên là Leader của lớp)
        TeamMember creator = TeamMember.builder()
                .team(team)
                .account(account)
                .role(TeamMemberRole.LEADER)
                .build();
        teamMemberRepository.save(creator);

        return toResponse(team, 1);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamResponse> getMyTeams(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));

        return teamRepository.findAllByMemberAccountId(account.getId())
                .stream()
                .filter(team -> {
                    // Logic: Lớp đã hủy (isActive=false) chỉ hiện với TEACHER của lớp đó.
                    // Học sinh (STUDENT) sẽ không thấy lớp đã hủy.
                    if (team.isActive()) {
                        return true;
                    }
                    
                    // Tìm vai trò của người yêu cầu trong team này
                    return team.getMembers().stream()
                            .anyMatch(m -> m.getAccount().getId().equals(account.getId()) 
                                        && TeamMemberRole.LEADER.equals(m.getRole()));
                })
                .map(team -> toResponse(team, team.getMembers().size()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TeamResponse updateTeam(Long teamId, UpdateTeamRequest request, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với id: " + teamId));

        TeamMember teamMember = teamMemberRepository.findByTeamIdAndAccountId(teamId, account.getId())
                .orElseThrow(() -> new RuntimeException("Bạn không phải là thành viên của lớp học này."));

        if (!TeamMemberRole.LEADER.equals(teamMember.getRole())) {
            throw new RuntimeException("Chỉ giáo viên (Leader) mới có quyền chỉnh sửa lớp học.");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            team.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription().trim());
        }

        team = teamRepository.save(team);
        return toResponse(team, team.getMembers().size());
    }

    @Override
    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long teamId, String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với id: " + teamId));

        // Kiểm tra xem người dùng có phải là thành viên không
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndAccountId(teamId, account.getId())
                .orElseThrow(() -> new RuntimeException("Bạn không có quyền truy cập lớp học này."));

        return toResponse(team, team.getMembers().size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(Long teamId, String email) {
        // 1. Tìm Account của người yêu cầu
        Account requester = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));

        // 2. Kiểm tra xem người yêu cầu có thuộc lớp học này không
        boolean isMember = teamMemberRepository.existsByTeamIdAndAccountId(teamId, requester.getId());
        if (!isMember) {
            throw new RuntimeException("Bạn không có quyền truy cập danh sách thành viên của lớp học này.");
        }

        // 3. Lấy tất cả thành viên của lớp
        List<TeamMember> members = teamMemberRepository.findAllByTeamId(teamId);

        // 4. Map sang TeamMemberResponse
        return members.stream().map(m -> {
            Account userAcc = m.getAccount();
            Profile userProfile = profileRepository.findById(userAcc.getId()).orElse(null);

            String fullName = "Unknown User";
            String avatarUrl = null;

            if (userProfile != null) {
                fullName = (userProfile.getFirstName() != null ? userProfile.getFirstName() : "") + " "
                        + (userProfile.getLastName() != null ? userProfile.getLastName() : "");
                fullName = fullName.trim();
                avatarUrl = userProfile.getAvatarUrl();
            }

            return TeamMemberResponse.builder()
                    .id(m.getId())
                    .accountId(userAcc.getId())
                    .fullName(fullName.isEmpty() ? userAcc.getEmail() : fullName)
                    .email(userAcc.getEmail())
                    .role(m.getRole().name())
                    .avatarUrl(avatarUrl)
                    .joinedAt(m.getJoinedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Tạo joinCode 8 ký tự unique (chỉ chứa chữ và số, viết hoa).
     */
    private String generateUniqueJoinCode() {
        String code;
        int maxAttempts = 10;
        int attempts = 0;
        do {
            code = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            attempts++;
            if (attempts > maxAttempts) {
                throw new RuntimeException("Không thể tạo mã lớp học duy nhất. Vui lòng thử lại.");
            }
        } while (teamRepository.existsByJoinCode(code));
        return code;
    }

    /**
     * Ánh xạ entity Team sang TeamResponse DTO.
     */
    private TeamResponse toResponse(Team team, int memberCount) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .joinCode(team.getJoinCode())
                .isActive(team.isActive())
                .createdAt(team.getCreatedAt())
                .schoolId(team.getSchool() != null ? team.getSchool().getId() : null)
                .schoolName(team.getSchool() != null ? team.getSchool().getName() : null)
                .departmentId(team.getDepartment() != null ? team.getDepartment().getId() : null)
                .departmentName(team.getDepartment() != null ? team.getDepartment().getDepartmentName() : null)
                .memberCount(memberCount)
                .build();
    }

    // ─── Cancel Team ──────────────────────────────────────────────────────────

    /**
     * Hủy lớp học (soft-delete: isActive = false).
     * Chỉ TEACHER của lớp mới được phép. Lớp đã hủy không thể hủy lại.
     */
    @Override
    @Transactional
    public TeamResponse cancelTeam(Long teamId, String email) {
        // 1. Xác thực tài khoản
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));

        // 2. Tìm lớp học
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với id: " + teamId));

        // 3. Kiểm tra lớp đã bị hủy chưa
        if (!team.isActive()) {
            throw new IllegalStateException("Lớp học này đã bị hủy trước đó.");
        }

        // 4. Kiểm tra quyền TEACHER
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndAccountId(teamId, account.getId())
                .orElseThrow(() -> new RuntimeException("Bạn không phải là thành viên của lớp học này."));

        if (!TeamMemberRole.LEADER.equals(teamMember.getRole())) {
            throw new SecurityException("Chỉ giáo viên (Leader) mới có quyền hủy lớp học.");
        }

        // 5. Soft-delete: đánh dấu isActive = false
        team.setActive(false);
        team = teamRepository.save(team);

        return toResponse(team, team.getMembers().size());
    }
}
