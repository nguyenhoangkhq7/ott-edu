-- =============================================================
-- Flyway Migration V3: Add grading support
-- SmileEdu – assignment-service
-- =============================================================
-- 1. Tạo bảng grades
CREATE TABLE grades (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL UNIQUE,
    graded_by_teacher_id BIGINT NOT NULL,
    score DOUBLE NOT NULL,
    feedback TEXT NULL,
    graded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_grade_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id),
    INDEX idx_teacher (graded_by_teacher_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- 2. Tạo bảng grade_logs (log tracking)
CREATE TABLE grade_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    grade_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    changed_by_teacher_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_grade FOREIGN KEY (grade_id) REFERENCES grades (id) ON DELETE CASCADE,
    INDEX idx_grade (grade_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;