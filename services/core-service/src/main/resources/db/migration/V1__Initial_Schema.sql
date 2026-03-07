-- 1. Bảng Quyền (Roles)
CREATE TABLE IF NOT EXISTS roles (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Tài khoản (Accounts) - Thay thế cho bảng users cũ
CREATE TABLE IF NOT EXISTS accounts (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng phân quyền (Account_Roles)
CREATE TABLE IF NOT EXISTS account_roles (
                                             account_id BIGINT NOT NULL,
                                             role_id INT NOT NULL,
                                             PRIMARY KEY (account_id, role_id),
    CONSTRAINT fk_ar_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ar_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Hồ sơ (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
                                        account_id BIGINT PRIMARY KEY,
                                        first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    code VARCHAR(50),
    department VARCHAR(100),
    bio TEXT,
    phone VARCHAR(20),
    CONSTRAINT fk_profiles_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- INSERT DỮ LIỆU MẶC ĐỊNH CHO TÀI KHOẢN VÀ QUYỀN
-- -----------------------------------------------------------------------------

-- Chèn 3 quyền cơ bản vào hệ thống
INSERT INTO roles (name, description) VALUES
                                          ('ROLE_STUDENT', 'Sinh viên / Học viên'),
                                          ('ROLE_INSTRUCTOR', 'Giảng viên'),
                                          ('ROLE_ADMIN', 'Quản trị viên hệ thống');

-- Tạo tài khoản Admin mặc định (Mật khẩu băm của "admin123")
INSERT INTO accounts (id, email, password_hash, is_active)
VALUES (1, 'admin@otteducation.local', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE);

-- Gán quyền ROLE_ADMIN (id=3) cho tài khoản Admin (id=1)
INSERT INTO account_roles (account_id, role_id) VALUES (1, 3);

-- Tạo Profile cho Admin
INSERT INTO profiles (account_id, first_name, last_name, department)
VALUES (1, 'System', 'Admin', 'Ban Quản Trị');