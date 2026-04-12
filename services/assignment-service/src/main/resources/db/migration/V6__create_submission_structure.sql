-- =============================================================
-- Flyway Migration V6: Create submission structure tables
-- SmileEdu – assignment-service
-- =============================================================
-- ============================================================================
-- CREATE TABLE: submissions
-- Mục đích: Lưu trữ thông tin bài nộp của sinh viên (ESSAY và QUIZ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL COMMENT 'AccountID của sinh viên',
    content LONGTEXT COMMENT 'Nội dung bài nộp (cho ESSAY)',
    score DOUBLE COMMENT 'Điểm sinh viên nhận được (tính tự động cho QUIZ)',
    feedback LONGTEXT COMMENT 'Nhận xét từ giáo viên',
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_SUBMITTED' COMMENT 'NOT_SUBMITTED, SUBMITTED, GRADED, REJECTED, DEADLINE_PASSED',
    is_late BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Có quá hạn nộp hay không',
    submitted_at DATETIME COMMENT 'Thời gian sinh viên nộp bài',
    graded_at DATETIME COMMENT 'Thời gian giáo viên chấm điểm',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT uk_submission_student_assignment UNIQUE (assignment_id, student_id),
    INDEX idx_submission_status (status),
    INDEX idx_submission_student (student_id),
    INDEX idx_submission_submitted_at (submitted_at)
);
-- ============================================================================
-- CREATE TABLE: student_answers
-- Mục đích: Lưu trữ câu trả lời chi tiết cho từng câu hỏi (Quiz)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_answers (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_option_id BIGINT COMMENT 'ID của option được chọn',
    earned_points DOUBLE NOT NULL DEFAULT 0 COMMENT 'Điểm kiếm được cho câu hỏi này',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_answers_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_answers_option FOREIGN KEY (selected_option_id) REFERENCES answer_options(id) ON DELETE
    SET NULL,
        CONSTRAINT uk_student_answer_question UNIQUE (submission_id, question_id),
        INDEX idx_student_answer_question (question_id)
);
-- ============================================================================
-- CREATE TABLE: submission_material
-- Mục đích: Lưu trữ mối quan hệ N-N giữa Submissions và Materials (file đính kèm)
-- ============================================================================
CREATE TABLE IF NOT EXISTS submission_material (
    submission_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    PRIMARY KEY (submission_id, material_id),
    CONSTRAINT fk_submission_material_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_material_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);