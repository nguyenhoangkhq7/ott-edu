-- =============================================================
-- Flyway Migration V2: Add publish and submissions support
-- SmileEdu – assignment-service
-- =============================================================
-- 1. Thêm cột publish vào bảng assignments
ALTER TABLE assignments
ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN published_at DATETIME NULL;
-- 2. Tạo bảng submissions (cho sinh viên nộp bài)
CREATE TABLE submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    status ENUM(
        'NOT_SUBMITTED',
        'SUBMITTED',
        'GRADED',
        'REJECTED',
        'DEADLINE_PASSED'
    ) NOT NULL DEFAULT 'NOT_SUBMITTED',
    submitted_at DATETIME NULL,
    score DOUBLE NULL,
    feedback TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    INDEX idx_assignment_student (assignment_id, student_id),
    INDEX idx_team_id (team_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- 3. Tạo bảng submission_logs (log chi tiết cho tracking)
CREATE TABLE submission_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    action_detail TEXT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;