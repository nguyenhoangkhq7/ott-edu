-- =============================================================
-- Flyway Migration V5: Add submission content column
-- SmileEdu – assignment-service
-- =============================================================
-- Thêm cột content để lưu trữ nội dung bài nộp của sinh viên
ALTER TABLE submissions
ADD COLUMN content LONGTEXT NULL;