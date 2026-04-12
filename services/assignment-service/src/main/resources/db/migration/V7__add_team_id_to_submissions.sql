-- =============================================================
-- Flyway Migration V7: Add team_id to submissions table
-- SmileEdu – assignment-service
-- =============================================================
-- Mục đích: Thêm cột team_id trong bảng submissions
-- Xử lý trường hợp cột đã tồn tại bằng cách xóa và tạo lại
-- Kiểm tra và xóa cột team_id nếu tồn tại
SET @dbname = DATABASE();
SET @tablename = "submissions";
SET @columnname = "team_id";
SET @preparedStatement = (
    SELECT IF(
        (
          SELECT COUNT(*)
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE table_name = @tablename
            AND table_schema = @dbname
            AND column_name = @columnname
        ) > 0,
        CONCAT(
          "ALTER TABLE ",
          @tablename,
          " DROP COLUMN ",
          @columnname
        ),
        "SELECT 1"
      )
  );
PREPARE stmt
FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- Thêm cột team_id mới
ALTER TABLE submissions
ADD COLUMN team_id BIGINT NOT NULL DEFAULT 1
AFTER student_id;
-- Tạo index cho team_id
ALTER TABLE submissions
ADD INDEX idx_submission_team (team_id);