package view_results.services;

import view_results.dto.GradeResponseDTO;
import view_results.dto.SubmissionHistoryDTO;

import java.util.List;

/**
 * Service để xem kết quả chấm điểm của sinh viên
 */
public interface ViewResultService {

    /**
     * Lấy kết quả chấm điểm của sinh viên cho một bài tập
     *
     * @param assignmentId ID của bài tập
     * @param studentId    ID của sinh viên
     * @return GradeResponseDTO chứa thông tin kết quả chấm
     */
    GradeResponseDTO getStudentResult(Long assignmentId, Long studentId);

    /**
     * Lấy lịch sử nộp bài của sinh viên (cho các bài tập cho phép revision)
     *
     * @param assignmentId ID của bài tập
     * @param studentId    ID của sinh viên
     * @return Danh sách các lần nộp
     */
    List<SubmissionHistoryDTO> getSubmissionHistory(Long assignmentId, Long studentId);

    /**
     * Kiểm tra xem sinh viên có quyền xem kết quả này không
     *
     * @param assignmentId     ID của bài tập
     * @param studentId        ID của sinh viên
     * @param requestingUserId ID của người yêu cầu (từ JWT token)
     * @return true nếu có quyền, false nếu không
     */
    boolean canViewResult(Long assignmentId, Long studentId, Long requestingUserId);
}
