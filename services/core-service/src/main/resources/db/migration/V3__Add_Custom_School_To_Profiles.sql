-- Thêm 2 cột để lưu trữ tên Trường và Khoa do người dùng tự nhập tay
ALTER TABLE profiles 
    ADD COLUMN custom_school VARCHAR(255) NULL,
    ADD COLUMN custom_department VARCHAR(255) NULL;

ALTER TABLE profiles 
    ADD COLUMN school_id BIGINT NULL,
    ADD CONSTRAINT fk_profiles_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;