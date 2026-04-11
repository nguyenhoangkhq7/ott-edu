package scoring_feedback.entities;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity đại diện cho một câu trả lời của sinh viên cho một câu hỏi (Quiz)
 * Dùng cho scoring_feedback module (làm điểm, feedback)
 */
@Entity(name = "ScoringStudentAnswer")
@Table(name = "scoring_student_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của submission
     */
    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    /**
     * ID của câu hỏi
     */
    @Column(name = "question_id", nullable = false)
    private Long questionId;

    /**
     * ID của đáp án được chọn (answer_option_id)
     */
    @Column(name = "selected_answer_id", nullable = true)
    private Long selectedAnswerId;

    /**
     * Căn cứ đáp án có đúng hay không
     */
    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;
}