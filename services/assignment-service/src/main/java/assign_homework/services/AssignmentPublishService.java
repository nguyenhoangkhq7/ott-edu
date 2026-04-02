package assign_homework.services;

import assign_homework.clients.ChatServiceClient;
import assign_homework.dto.ChatNotificationDTO;
import assign_homework.dto.PublishAssignmentResponseDTO;
import assign_homework.entities.Submission;
import assign_homework.repositories.SubmissionRepository;
import create_assignment.entities.Assignment;
import create_assignment.exceptions.BadRequestException;
import create_assignment.repositories.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service để xử lý logic "giao bài tập" (publish assignment)
 * - Cập nhật status bài tập
 * - Tạo submission rỗng cho tất cả sinh viên
 * - Gửi thông báo sang chat-service
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentPublishService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final ChatServiceClient chatServiceClient;

    /**
     * Giao bài tập cho một team
     *
     * @param assignmentId ID của bài tập
     * @param teacherId    ID của giáo viên (dùng để validate quyền)
     * @param senderName   Tên giáo viên (để hiển thị trong thông báo)
     * @return Response DTO
     */
    @Transactional
    public PublishAssignmentResponseDTO publishAssignment(Long assignmentId, Long teacherId, String senderName) {
        log.info("Publishing assignment: id={}, teacher={}", assignmentId, teacherId);

        // ---- 1. Xác thực bài tập tồn tại ----
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new BadRequestException("Bài tập không tồn tại với ID: " + assignmentId));

        // ---- 2. Kiểm tra xem đã giao chưa ----
        if (assignment.getIsPublished()) {
            throw new BadRequestException("Bài tập này đã được giao rồi.");
        }

        // ---- 3. Cập nhật bài tập: isPublished = true, publishedAt = now ----
        assignment.setIsPublished(true);
        assignment.setPublishedAt(LocalDateTime.now());
        Assignment publishedAssignment = assignmentRepository.save(assignment);
        log.info("Assignment published: id={}, publishedAt={}", assignmentId, publishedAssignment.getPublishedAt());

        // ---- 4. Tạo submissions cho tất cả sinh viên trong team ----
        int submissionCount = createSubmissionsForTeam(assignmentId, assignment.getTeamId());
        log.info("Created {} submissions for assignment: id={}, team={}", submissionCount, assignmentId,
                assignment.getTeamId());

        // ---- 5. Gửi thông báo sang chat-service (async) ----
        sendNotificationAsync(assignment, senderName);

        // ---- 6. Trả về response ----
        return PublishAssignmentResponseDTO.builder()
                .assignmentId(assignmentId)
                .title(assignment.getTitle())
                .publishedAt(publishedAssignment.getPublishedAt())
                .teamId(assignment.getTeamId())
                .submissionsCreated(submissionCount)
                .message("Bài tập '" + assignment.getTitle() + "' đã được giao thành công cho " + submissionCount
                        + " sinh viên.")
                .build();
    }

    /**
     * Tạo Submission rỗng cho tất cả sinh viên trong team
     * (Tạm thời: tạo fixed 30 submissions để demo, sau này cần gọi team-service để
     * lấy danh sách sinh viên thực)
     *
     * @param assignmentId ID bài tập
     * @param teamId       ID team/lớp
     * @return Số lượng submissions tạo
     */
    private int createSubmissionsForTeam(Long assignmentId, Long teamId) {
        try {
            // TODO: Gọi team-service REST API để lấy danh sách sinh viên trong team
            // GET /api/teams/{teamId}/students
            // Tạm thời hardcode 30 sinh viên để demo

            List<Submission> submissions = new ArrayList<>();
            for (long i = 1; i <= 30; i++) {
                long studentId = i; // ID giả định

                // Kiểm tra xem submission đã tồn tại chưa
                if (!submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, studentId)) {
                    Submission submission = Submission.builder()
                            .assignmentId(assignmentId)
                            .studentId(studentId)
                            .teamId(teamId)
                            .build();
                    submissions.add(submission);
                }
            }

            if (!submissions.isEmpty()) {
                submissionRepository.saveAll(submissions);
            }

            return submissions.size();
        } catch (Exception e) {
            log.error("Error creating submissions for assignment: {}, team: {}", assignmentId, teamId, e);
            throw new BadRequestException("Lỗi tạo submissions: " + e.getMessage());
        }
    }

    /**
     * Gửi thông báo sang chat-service (async - không chặn response)
     *
     * @param assignment Bài tập vừa được giao
     * @param senderName Tên giáo viên
     */
    @Async
    private void sendNotificationAsync(Assignment assignment, String senderName) {
        try {
            ChatNotificationDTO notification = ChatNotificationDTO.builder()
                    .teamId(assignment.getTeamId())
                    .notificationType("ASSIGNMENT_PUBLISHED")
                    .assignmentId(assignment.getId())
                    .senderName(senderName)
                    .message(String.format(
                            "📚 Giáo viên %s vừa giao bài tập mới: \"%s\"\n⏰ Hạn nộp: %s",
                            senderName,
                            assignment.getTitle(),
                            assignment.getDueDate()))
                    .build();

            chatServiceClient.sendNotification(notification);
            log.info("Notification sent to chat-service for team: {}", assignment.getTeamId());
        } catch (Exception e) {
            log.warn("Failed to send notification to chat-service", e);
            // Không throw exception ở đây để không ảnh hưởng tới quá trình publish
        }
    }

    /**
     * Lấy thông tin chi tiết về submissions của một bài tập
     */
    public List<Submission> getSubmissionsForAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }
}
