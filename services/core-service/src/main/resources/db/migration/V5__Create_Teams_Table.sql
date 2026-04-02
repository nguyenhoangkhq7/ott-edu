-- V5: Tạo bảng Teams (Lớp học) và TeamMembers (Thành viên lớp)

-- 1. Bảng Teams (Lớp học)
CREATE TABLE IF NOT EXISTS teams (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    join_code   VARCHAR(20)  NOT NULL UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    school_id     BIGINT,
    department_id BIGINT,
    CONSTRAINT fk_teams_school     FOREIGN KEY (school_id)     REFERENCES schools(id)     ON DELETE SET NULL,
    CONSTRAINT fk_teams_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng TeamMembers (Thành viên lớp)
CREATE TABLE IF NOT EXISTS team_members (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id     BIGINT      NOT NULL,
    account_id  BIGINT      NOT NULL,
    member_role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    joined_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tm_team    FOREIGN KEY (team_id)    REFERENCES teams(id)    ON DELETE CASCADE,
    CONSTRAINT fk_tm_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT uq_tm_team_account UNIQUE (team_id, account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
