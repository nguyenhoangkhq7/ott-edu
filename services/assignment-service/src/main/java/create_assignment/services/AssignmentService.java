package create_assignment.services;

import create_assignment.dto.AssignmentRequestDTO;
import create_assignment.dto.AssignmentResponseDTO;

public interface AssignmentService {

    /**
     * Tạo bài tập mới.
     *
     * @param dto thông tin bài tập từ Giảng viên
     * @return thông tin bài tập đã được tạo
     */
    AssignmentResponseDTO createAssignment(AssignmentRequestDTO dto);
}
