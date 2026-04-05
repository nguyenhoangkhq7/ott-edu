-- Migration V14: Seed Super Student for Testing
-- Password: 12345678
INSERT INTO accounts (email, password_hash, role, status, is_email_verified, is_active, created_at)
VALUES ('sinhvien@gmail.com', '$2a$10$7R9bZOnpYI2b20A9GIsQbuV5GEnO/mYV6Z6jR1d0.TjGkXvR0U5pW', 'ROLE_STUDENT', 'AVAILABLE', true, true, NOW());

-- Get ID
SET @super_student_id = LAST_INSERT_ID();

-- Create Profile
INSERT INTO profiles (account_id, first_name, last_name, code, is_verified, school_id, department_id)
VALUES (@super_student_id, 'Sinh Viên', 'Mới', 'SV888', true, 1, 1);

-- Enroll into Team 1 (Lớp học thử nghiệm Java)
INSERT INTO team_members (joined_at, role, account_id, team_id)
VALUES (NOW(), 'MEMBER', @super_student_id, 1);
