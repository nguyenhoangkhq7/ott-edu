package fit.iuh.modules.team.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.Department;
import fit.iuh.models.Profile;
import fit.iuh.models.Team;
import fit.iuh.models.TeamMember;
import fit.iuh.models.TeamMemberRole;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.team.integration.ChatConversationSyncService;
import fit.iuh.modules.team.dtos.AddTeamMemberRequest;
import fit.iuh.modules.team.dtos.TeamMemberResponse;
import fit.iuh.modules.team.dtos.TeamRequest;
import fit.iuh.modules.team.dtos.TeamResponse;
import fit.iuh.modules.team.dtos.UpdateTeamStatusRequest;
import fit.iuh.modules.team.dtos.UpdateTeamMemberRoleRequest;
import fit.iuh.modules.team.mappers.TeamMapper;
import fit.iuh.modules.team.repositories.TeamMemberRepository;
import fit.iuh.modules.team.repositories.TeamRepository;
import fit.iuh.modules.team.repositories.TeamJoinRequestRepository;
import fit.iuh.models.TeamJoinRequest;
import fit.iuh.modules.team.dtos.JoinRequestResponse;
import fit.iuh.modules.team.services.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamServiceImpl implements TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProfileRepository profileRepository;
    private final AccountRepository accountRepository;
    private final TeamJoinRequestRepository teamJoinRequestRepository;
    private final TeamMapper teamMapper;
    private final ChatConversationSyncService chatConversationSyncService;

    @Override
    @Transactional
    public TeamResponse createTeam(TeamRequest request, String creatorEmail) {
        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .joinCode(request.getJoinCode())
                .isActive(true)
                .isApprovalRequired(request.getIsApprovalRequired())
                .createdAt(LocalDateTime.now())
                .department(Department.builder().id(request.getDepartmentId()).build())
                .build();

        Team savedTeam = teamRepository.save(team);
        Account creatorAccount = accountRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Account not found with email: " + creatorEmail));

        TeamMember creatorMember = TeamMember.builder()
                .account(creatorAccount)
                .team(savedTeam)
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(creatorMember);

        Team syncedTeam = teamRepository.findById(savedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + savedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(savedTeam.getId()));

        return enrichTeamResponse(teamMapper.toResponse(syncedTeam), syncedTeam);
    }

    @Override
    public TeamResponse getTeamById(Long teamId, String requesterEmail) {
        Account account = getAccountByEmail(requesterEmail);
        requireTeamMembership(teamId, account.getId());
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        return enrichTeamResponse(teamMapper.toResponse(team), team);
    }

    @Override
    public List<TeamResponse> getAllTeams(String requesterEmail) {
        Account account = getAccountByEmail(requesterEmail);
        return teamMemberRepository.findByAccountId(account.getId()).stream()
                .map(TeamMember::getTeam)
                .filter(team -> team != null)
                .collect(Collectors.toMap(Team::getId, team -> team, (left, right) -> left, LinkedHashMap::new))
                .values()
                .stream()
                .map(t -> enrichTeamResponse(teamMapper.toResponse(t), t))
                .toList();
    }

    @Override
    public List<TeamResponse> getTeamsByDepartmentId(Long departmentId, String requesterEmail) {
        Account account = getAccountByEmail(requesterEmail);
        Set<Long> accessibleTeamIds = teamMemberRepository.findByAccountId(account.getId()).stream()
                .map(member -> member.getTeam().getId())
                .collect(Collectors.toSet());

        return teamRepository.findByDepartmentId(departmentId).stream()
                .filter(team -> accessibleTeamIds.contains(team.getId()))
                .map(t -> enrichTeamResponse(teamMapper.toResponse(t), t))
                .toList();
    }

    @Override
    @Transactional
    public TeamResponse updateTeam(Long teamId, TeamRequest request, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setJoinCode(request.getJoinCode());
        team.setDepartment(Department.builder().id(request.getDepartmentId()).build());
        team.setApprovalRequired(request.getIsApprovalRequired());

        Team updatedTeam = teamRepository.save(team);
        Team syncedTeam = teamRepository.findById(updatedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + updatedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(updatedTeam.getId()));
        return enrichTeamResponse(teamMapper.toResponse(syncedTeam), syncedTeam);
    }

    @Override
    @Transactional
    public void deleteTeam(Long teamId, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setActive(false);
        team.setDeletedAt(LocalDateTime.now());
        Team deletedTeam = teamRepository.save(team);
        Team syncedTeam = teamRepository.findById(deletedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + deletedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                true,
                teamMemberRepository.findAllByTeamId(deletedTeam.getId()));
    }

    @Override
    public TeamResponse getTeamByJoinCode(String joinCode) {
        Team team = teamRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new RuntimeException("Team not found with joinCode: " + joinCode));
        return enrichTeamResponse(teamMapper.toResponse(team), team);
    }

    @Override
    public List<TeamMemberResponse> getTeamMembers(Long teamId, String requesterEmail) {
        Account account = getAccountByEmail(requesterEmail);
        requireTeamMembership(teamId, account.getId());

        // Verify team exists
        teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        List<TeamMember> members = teamMemberRepository.findAllByTeamId(teamId);

        return members.stream()
                .map(member -> {
                    Profile profile = profileRepository.findById(member.getAccount().getId()).orElse(null);
                    String firstName = profile != null ? profile.getFirstName() : "";
                    String lastName = profile != null ? profile.getLastName() : "";

                    return TeamMemberResponse.builder()
                            .id(member.getId())
                            .accountId(member.getAccount().getId())
                            .email(member.getAccount().getEmail())
                            .firstName(firstName)
                            .lastName(lastName)
                            .role(member.getRole().name())
                            .joinedAt(member.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request, String requesterEmail) {
        Account requesterAccount = getAccountByEmail(requesterEmail);
        TeamMember requesterMember = requireTeamMembership(teamId, requesterAccount.getId());
        boolean isLeader = requesterMember.getRole() == TeamMemberRole.LEADER;

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        Account targetAccount = resolveAccountForMemberRequest(request);

        if (teamMemberRepository.findByTeamIdAndAccountId(teamId, targetAccount.getId()).isPresent()) {
            throw new RuntimeException("Tài khoản đã là thành viên của lớp: " + teamId);
        }

        // Nếu người mời không phải Leader, không được phân quyền LEADER cho người khác
        TeamMemberRole requestedRole = TeamMemberRole.valueOf(request.getRole());
        if (!isLeader && requestedRole == TeamMemberRole.LEADER) {
            throw new AccessDeniedException("Chỉ trưởng lớp mới có thể phân quyền Trưởng lớp.");
        }

        // Logic duyệt: Nếu lớp cần duyệt VÀ người mời không phải là LEADER
        if (team.isApprovalRequired() && !isLeader) {
            java.util.Optional<TeamJoinRequest> existingRequest = teamJoinRequestRepository.findByTeamIdAndAccountId(teamId, targetAccount.getId());
            if (existingRequest.isPresent() && existingRequest.get().getStatus() == TeamJoinRequest.JoinRequestStatus.PENDING) {
                return TeamMemberResponse.builder().id(-1L).email(targetAccount.getEmail()).build();
            }
            if (existingRequest.isPresent() && existingRequest.get().getStatus() == TeamJoinRequest.JoinRequestStatus.REJECTED) {
                TeamJoinRequest req = existingRequest.get();
                req.setStatus(TeamJoinRequest.JoinRequestStatus.PENDING);
                req.setRequestedAt(java.time.LocalDateTime.now());
                teamJoinRequestRepository.save(req);
                return TeamMemberResponse.builder().id(-1L).email(targetAccount.getEmail()).build();
            }
            if (!existingRequest.isPresent()) {
                TeamJoinRequest req = TeamJoinRequest.builder()
                        .team(team)
                        .account(targetAccount)
                        .status(TeamJoinRequest.JoinRequestStatus.PENDING)
                        .requestedAt(java.time.LocalDateTime.now())
                        .build();
                teamJoinRequestRepository.save(req);
                return TeamMemberResponse.builder().id(-1L).email(targetAccount.getEmail()).build();
            }
        }

        // Nếu người mời là Leader hoặc lớp không cần duyệt -> Thêm thẳng vào
        TeamMember newMember = TeamMember.builder()
                .account(targetAccount)
                .team(team)
                .role(requestedRole)
                .joinedAt(java.time.LocalDateTime.now())
                .build();

        newMember = teamMemberRepository.save(newMember);

        Profile profile = profileRepository.findById(targetAccount.getId()).orElse(null);
        String firstName = profile != null ? profile.getFirstName() : "";
        String lastName = profile != null ? profile.getLastName() : "";

        Team syncedTeam = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(teamId));

        return TeamMemberResponse.builder()
                .id(newMember.getId())
                .accountId(newMember.getAccount().getId())
                .email(newMember.getAccount().getEmail())
                .firstName(firstName)
                .lastName(lastName)
                .role(newMember.getRole().name())
                .joinedAt(newMember.getJoinedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteTeamMember(Long teamId, Long memberId, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        TeamMember member = teamMemberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Team member not found with id: " + memberId));

        if (!member.getTeam().getId().equals(team.getId())) {
            throw new RuntimeException("Team member does not belong to team: " + teamId);
        }

        teamMemberRepository.delete(member);

        Team syncedTeam = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(teamId));
    }

    @Override
    @Transactional
    public TeamResponse updateTeamStatus(Long teamId, UpdateTeamStatusRequest request, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        team.setActive(request.isActive());
        Team updatedTeam = teamRepository.save(team);
        Team syncedTeam = teamRepository.findById(updatedTeam.getId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + updatedTeam.getId()));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(updatedTeam.getId()));
        return enrichTeamResponse(teamMapper.toResponse(syncedTeam), syncedTeam);
    }

    @Override
    @Transactional
    public TeamResponse joinTeamByCode(String joinCode, String requesterEmail) {
        Team team = teamRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với mã: " + joinCode));

        if (!team.isActive()) {
            throw new RuntimeException("Lớp học này hiện đang bị khóa.");
        }

        Account account = getAccountByEmail(requesterEmail);
        java.util.Optional<TeamMember> existingMember = teamMemberRepository.findByTeamIdAndAccountId(team.getId(), account.getId());
        if (existingMember.isPresent()) {
            throw new RuntimeException("Bạn đã là thành viên của lớp học này rồi.");
        }

        if (team.isApprovalRequired()) {
            java.util.Optional<TeamJoinRequest> existingRequest = teamJoinRequestRepository.findByTeamIdAndAccountId(team.getId(), account.getId());
            if (existingRequest.isPresent() && existingRequest.get().getStatus() == TeamJoinRequest.JoinRequestStatus.PENDING) {
                return TeamResponse.builder().id(-1L).name("PENDING").description("Yêu cầu tham gia của bạn đang chờ phê duyệt.").build();
            }
            if (existingRequest.isPresent() && existingRequest.get().getStatus() == TeamJoinRequest.JoinRequestStatus.REJECTED) {
                TeamJoinRequest req = existingRequest.get();
                req.setStatus(TeamJoinRequest.JoinRequestStatus.PENDING);
                req.setRequestedAt(java.time.LocalDateTime.now());
                teamJoinRequestRepository.save(req);
                return TeamResponse.builder().id(-1L).name("PENDING").description("Yêu cầu tham gia đã được gửi lại. Vui lòng chờ duyệt.").build();
            }
            if (!existingRequest.isPresent()) {
                TeamJoinRequest req = TeamJoinRequest.builder()
                        .team(team)
                        .account(account)
                        .status(TeamJoinRequest.JoinRequestStatus.PENDING)
                        .requestedAt(java.time.LocalDateTime.now())
                        .build();
                teamJoinRequestRepository.save(req);
                return TeamResponse.builder().id(-1L).name("PENDING").description("Yêu cầu tham gia đã được gửi. Vui lòng chờ Trưởng nhóm duyệt.").build();
            }
        }

        TeamMember newMember = TeamMember.builder()
                .account(account)
                .team(team)
                .role(TeamMemberRole.MEMBER)
                .joinedAt(java.time.LocalDateTime.now())
                .build();
        teamMemberRepository.save(newMember);

        chatConversationSyncService.syncClassConversation(
                team,
                !team.isActive(),
                teamMemberRepository.findAllByTeamId(team.getId()));

        return enrichTeamResponse(teamMapper.toResponse(team), team);
    }

    @Override
    @Transactional
    public void updateMemberRole(Long teamId, Long memberId, UpdateTeamMemberRoleRequest request, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        TeamMember member = teamMemberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Team member not found with id: " + memberId));

        if (!member.getTeam().getId().equals(team.getId())) {
            throw new RuntimeException("Team member does not belong to team: " + teamId);
        }

        try {
            member.setRole(TeamMemberRole.valueOf(request.getRole()));
            teamMemberRepository.save(member);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + request.getRole());
        }
    }

    @Override
    @Transactional
    public void leaveTeam(Long teamId, String requesterEmail) {
        Account account = getAccountByEmail(requesterEmail);
        TeamMember member = requireTeamMembership(teamId, account.getId());

        if (member.getRole() == TeamMemberRole.LEADER) {
            List<TeamMember> allMembers = teamMemberRepository.findAllByTeamId(teamId);
            long otherLeaders = allMembers.stream()
                    .filter(m -> m.getRole() == TeamMemberRole.LEADER && !m.getAccount().getId().equals(account.getId()))
                    .count();

            if (otherLeaders == 0 && allMembers.size() > 1) {
                throw new RuntimeException("Vui lòng chuyển quyền Trưởng nhóm cho người khác trước khi rời lớp.");
            }
        }

        teamMemberRepository.delete(member);

        Team syncedTeam = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        chatConversationSyncService.syncClassConversation(
                syncedTeam,
                !syncedTeam.isActive(),
                teamMemberRepository.findAllByTeamId(teamId));
    }

    @Override
    public List<JoinRequestResponse> getPendingJoinRequests(Long teamId, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        return teamJoinRequestRepository.findByTeamIdAndStatus(teamId, TeamJoinRequest.JoinRequestStatus.PENDING)
                .stream()
                .map(req -> {
                    Profile profile = profileRepository.findById(req.getAccount().getId()).orElse(null);
                    return JoinRequestResponse.builder()
                            .id(req.getId())
                            .teamId(req.getTeam().getId())
                            .accountId(req.getAccount().getId())
                            .email(req.getAccount().getEmail())
                            .firstName(profile != null ? profile.getFirstName() : "")
                            .lastName(profile != null ? profile.getLastName() : "")
                            .status(req.getStatus().name())
                            .requestedAt(req.getRequestedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approveJoinRequest(Long teamId, Long requestId, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        TeamJoinRequest request = teamJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!request.getTeam().getId().equals(teamId)) {
            throw new RuntimeException("Request does not belong to team");
        }

        request.setStatus(TeamJoinRequest.JoinRequestStatus.APPROVED);
        teamJoinRequestRepository.save(request);

        TeamMember newMember = TeamMember.builder()
                .account(request.getAccount())
                .team(request.getTeam())
                .role(TeamMemberRole.MEMBER)
                .joinedAt(java.time.LocalDateTime.now())
                .build();
        teamMemberRepository.save(newMember);

        chatConversationSyncService.syncClassConversation(
                request.getTeam(),
                !request.getTeam().isActive(),
                teamMemberRepository.findAllByTeamId(teamId));
    }

    @Override
    @Transactional
    public void rejectJoinRequest(Long teamId, Long requestId, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        TeamJoinRequest request = teamJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!request.getTeam().getId().equals(teamId)) {
            throw new RuntimeException("Request does not belong to team");
        }

        request.setStatus(TeamJoinRequest.JoinRequestStatus.REJECTED);
        teamJoinRequestRepository.save(request);
    }

    @Override
    @Transactional
    public void updateApprovalSetting(Long teamId, boolean isApprovalRequired, String requesterEmail) {
        requireLeaderMembership(teamId, requesterEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        team.setApprovalRequired(isApprovalRequired);
        teamRepository.save(team);
    }

    private Account getAccountByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new AccessDeniedException("Bạn không có quyền truy cập tài nguyên này.");
        }

        return accountRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new AccessDeniedException("Bạn không có quyền truy cập tài nguyên này."));
    }

    private Account resolveAccountForMemberRequest(AddTeamMemberRequest request) {
        if (request.getAccountId() != null) {
            return accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Account not found with id: " + request.getAccountId()));
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String normalizedEmail = normalizeEmail(request.getEmail());
            return accountRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new RuntimeException("Account not found with email: " + request.getEmail()));
        }

        throw new RuntimeException("Account ID hoặc email là bắt buộc.");
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private TeamMember requireTeamMembership(Long teamId, Long accountId) {
        return teamMemberRepository.findByTeamIdAndAccountId(teamId, accountId)
                .orElseThrow(() -> new AccessDeniedException("Bạn chưa tham gia lớp học này."));
    }

    private TeamMember requireLeaderMembership(Long teamId, String requesterEmail) {
        Account account = getAccountByEmail(requesterEmail);
        TeamMember member = requireTeamMembership(teamId, account.getId());
        if (member.getRole() != TeamMemberRole.LEADER) {
            throw new AccessDeniedException("Chỉ trưởng lớp mới có quyền thực hiện thao tác này.");
        }
        return member;
    }

    private TeamResponse enrichTeamResponse(TeamResponse response, Team team) {
        if (response == null || team == null) {
            return response;
        }

        // Find the creator (first LEADER of the team)
        TeamMember creator = team.getMembers().stream()
                .filter(m -> m.getRole() == TeamMemberRole.LEADER)
                .min(java.util.Comparator.comparing(TeamMember::getJoinedAt)
                        .thenComparing(TeamMember::getId))
                .orElse(null);

        if (creator != null && creator.getAccount() != null && creator.getAccount().getRole() != null) {
            response.setCreatorRole(creator.getAccount().getRole().name());
        } else {
            response.setCreatorRole("ROLE_STUDENT"); // default fallback
        }
        return response;
    }
}
