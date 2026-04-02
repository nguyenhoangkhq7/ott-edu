package create_assignment.dto;

import create_assignment.enums.AssignmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequestDTO {

    private String title;

    private String instructions;

    private Double maxScore;

    private LocalDateTime dueDate;

    private AssignmentType type;

    private Long teamId;

    /** Danh sách ID của Materials đã tồn tại trong DB cần đính kèm */
    @Builder.Default
    private List<Long> materialIds = new ArrayList<>();

    /** Danh sách câu hỏi — chỉ điền nếu type == QUIZ */
    @Builder.Default
    private List<QuestionDTO> questions = new ArrayList<>();
}
