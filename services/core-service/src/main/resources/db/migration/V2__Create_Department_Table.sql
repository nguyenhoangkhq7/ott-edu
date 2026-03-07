-- 1. Tạo bảng Schools (Trường học) - Chỉ dùng name
CREATE TABLE IF NOT EXISTS schools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tạo bảng Departments (Khoa / Phòng ban)
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    school_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_departments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Chèn dữ liệu mẫu (Chỉ cần truyền name)
INSERT INTO schools (name) VALUES ('Đại học Công nghiệp TP.HCM');

-- Lấy ID của trường vừa tạo để chèn các Khoa
SET @school_id = LAST_INSERT_ID();

INSERT INTO departments (school_id, name) VALUES 
(@school_id, 'Khoa Công nghệ Thông tin'),
(@school_id, 'Khoa Thương mại Điện tử'),
(@school_id, 'Khoa Quản trị Kinh doanh');

-- 4. Cập nhật bảng profiles: Xóa cột department cũ, thêm department_id
ALTER TABLE profiles 
    DROP COLUMN department,
    ADD COLUMN department_id BIGINT;

-- Thêm khóa ngoại cho bảng profiles
ALTER TABLE profiles 
    ADD CONSTRAINT fk_profiles_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;