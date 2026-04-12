-- =============================================================
-- Flyway Migration V4: Add student answers support (for Quiz)
-- SmileEdu – assignment-service
-- =============================================================
-- Tạo bảng student_answers để lưu trữ các câu trả lời của sinh viên cho các câu hỏi (Quiz)
CREATE TABLE student_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_answer_id BIGINT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_sa_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_answer_option FOREIGN KEY (selected_answer_id) REFERENCES answer_options (id) ON DELETE
    SET NULL,
        INDEX idx_submission (submission_id),
        INDEX idx_question (question_id),
        INDEX idx_is_correct (is_correct)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;