-- V12__Seed_15_Question_Student.sql
DELETE FROM profiles WHERE account_id IN (SELECT id FROM accounts WHERE email = 'hocsinh15@gmail.com');
DELETE FROM team_members WHERE account_id IN (SELECT id FROM accounts WHERE email = 'hocsinh15@gmail.com');
DELETE FROM accounts WHERE email = 'hocsinh15@gmail.com';

-- mật khẩu: 12345678
INSERT INTO accounts (email, password_hash, role, status, is_email_verified, created_at)
VALUES ('hocsinh15@gmail.com', '$2a$10$xwLPSdbeSSO1ZzVOliWNhuOIIFSoLoIuROiDzf1FodA1Cpf.hAlpm', 'ROLE_STUDENT', 'AVAILABLE', true, NOW());

SET @acc_id = LAST_INSERT_ID();

INSERT INTO profiles (account_id, first_name, last_name, code, school_id, department_id)
VALUES (@acc_id, 'Học Sinh', 'Mười Lăm', 'HS015', 1, 1);

INSERT IGNORE INTO team_members (joined_at, role, account_id, team_id)
VALUES (NOW(), 'MEMBER', @acc_id, 1);
