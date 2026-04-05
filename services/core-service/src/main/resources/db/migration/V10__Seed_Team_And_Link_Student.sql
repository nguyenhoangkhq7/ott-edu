-- V10__Seed_Team_And_Link_Student.sql

-- 1. Đảm bảo có School và Department (đã lược bỏ các cột không tồn tại)
INSERT IGNORE INTO schools (id, name) 
VALUES (1, 'IUH - Industrial University of Ho Chi Minh City');

INSERT IGNORE INTO departments (id, name, school_id) 
VALUES (1, 'Khoa Công nghệ thông tin', 1);

-- 2. Tạo Lớp học (Team) với ID = 1
INSERT IGNORE INTO teams (id, name, description, join_code, department_id, is_active, created_at)
VALUES (1, 'Lớp học thử nghiệm Java', 'Lớp học dùng để test chức năng Quiz', 'JAVA-TEST-2024', 1, true, NOW());

-- 3. Gán sinh viên student_test1@gmail.com vào lớp này
INSERT IGNORE INTO team_members (joined_at, role, account_id, team_id)
SELECT NOW(), 'STUDENT', id, 1 
FROM accounts 
WHERE email = 'student_test1@gmail.com';
