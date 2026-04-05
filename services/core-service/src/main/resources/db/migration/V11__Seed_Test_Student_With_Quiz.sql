-- V11__Seed_Test_Student_With_Quiz.sql
-- Delete if exists (to avoid duplicate on rerun)
DELETE FROM profiles WHERE account_id IN (SELECT id FROM accounts WHERE email = 'hocsinh@gmail.com');
DELETE FROM team_members WHERE account_id IN (SELECT id FROM accounts WHERE email = 'hocsinh@gmail.com');
DELETE FROM accounts WHERE email = 'hocsinh@gmail.com';

-- 1. Create a clean student account (Password: 123456)
INSERT INTO accounts (email, password_hash, role, status, is_email_verified, created_at)
VALUES ('hocsinh@gmail.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOu5HEpL.xjT5.v/pNo.n8qH.2.k./qeu', 'ROLE_STUDENT', 'AVAILABLE', true, NOW());

-- Get the ID of the newly created account
SET @new_student_id = LAST_INSERT_ID();

-- 2. Create profile
INSERT INTO profiles (account_id, first_name, last_name, code, school_id, department_id)
VALUES (@new_student_id, 'Học Sinh', 'Khá', 'HS001', 1, 1);

-- 3. Link to team 1 (Lớp học thử nghiệm Java)
-- The assignments are assigned to team 1 (Lớp học thử nghiệm Java)
-- Use IGNORE to avoid duplicate if already member
INSERT IGNORE INTO team_members (joined_at, role, account_id, team_id)
VALUES (NOW(), 'MEMBER', @new_student_id, 1);
