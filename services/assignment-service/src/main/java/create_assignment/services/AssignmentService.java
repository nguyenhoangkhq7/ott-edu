package create_assignment.services;

import create_assignment.dto.AssignmentRequestDTO;
import create_assignment.dto.AssignmentResponseDTO;

import java.util.List;

public interface AssignmentService {

    /**
     * Tạo bài tập mới.
     *
     * @param dto thông tin bài tập từ Giảng viên
     * @return thông tin bài tập đã được tạo
     */
    AssignmentResponseDTO createAssignment(AssignmentRequestDTO dto);

    /**
     * Lấy tất cả bài tập trong hệ thống.
     *
     * @return danh sách tất cả bài tập
     */
    List<AssignmentResponseDTO> getAllAssignments();

    /**
     * Lấy danh sách bài tập theo teamId.
     *
     * @param teamId ID của nhóm/lớp học
     * @return danh sách bài tập
     */
    List<AssignmentResponseDTO> getAssignmentsByTeam(Long teamId);

    /**
     * Lấy chi tiết một bài tập theo ID
     */
    AssignmentResponseDTO getAssignmentById(Long id);
}
