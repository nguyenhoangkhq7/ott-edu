-- =============================================================
-- Flyway Migration V2: Create Assignment Tables
-- SmileEdu – assignment-service
-- =============================================================

-- 1. Bảng tài liệu đính kèm
CREATE TABLE materials (
                           id   BIGINT AUTO_INCREMENT PRIMARY KEY,
                           name VARCHAR(255) NOT NULL,
                           url  VARCHAR(1000) NOT NULL,
                           type VARCHAR(100)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- 2. Bảng bài tập
CREATE TABLE assignments (
                             id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                             title        VARCHAR(255)               NOT NULL,
                             instructions TEXT,
                             max_score    DOUBLE                     NOT NULL,
                             due_date     DATETIME                   NOT NULL,
                             created_at   DATETIME                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             type         ENUM ('ESSAY', 'QUIZ')     NOT NULL,
                             team_id      BIGINT                     NOT NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- 3. Bảng trung gian @ManyToMany: Assignment <-> Material
CREATE TABLE assignment_material (
                                     assignment_id BIGINT NOT NULL,
                                     material_id   BIGINT NOT NULL,
                                     PRIMARY KEY (assignment_id, material_id),
                                     CONSTRAINT fk_am_assignment FOREIGN KEY (assignment_id)
                                         REFERENCES assignments (id) ON DELETE CASCADE,
                                     CONSTRAINT fk_am_material FOREIGN KEY (material_id)
                                         REFERENCES materials (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- 4. Bảng câu hỏi (dùng cho loại QUIZ)
CREATE TABLE questions (
                           id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                           content       TEXT   NOT NULL,
                           assignment_id BIGINT NOT NULL,
                           CONSTRAINT fk_q_assignment FOREIGN KEY (assignment_id)
                               REFERENCES assignments (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- 5. Bảng đáp án cho câu hỏi
CREATE TABLE answer_options (
                                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                                content     VARCHAR(1000) NOT NULL,
                                is_correct  BOOLEAN       NOT NULL DEFAULT FALSE,
                                question_id BIGINT        NOT NULL,
                                CONSTRAINT fk_ao_question FOREIGN KEY (question_id)
                                    REFERENCES questions (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;
