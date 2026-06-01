-- Seed integration test users (using INSERT IGNORE to prevent issues on existing environments)
INSERT IGNORE INTO accounts (id, email, password_hash, role, status, is_email_verified, is_online, is_locked)
VALUES 
(2, 'teacher@example.com', '$2a$10$76iYKB0Ztoi6xeAIGU.PSec8bouYMp5VEFxxQ1rNWseIpuZZQEAda', 'ROLE_TEACHER', 'AVAILABLE', TRUE, FALSE, FALSE),
(4, 'caothanhdong.41118@gmail.com', '$2a$10$Um4KRykKwNyta4eZYN6viu9KYsjJ230oHVS0FgIf1ItuT/H7HNk6W', 'ROLE_STUDENT', 'AVAILABLE', TRUE, FALSE, FALSE);

-- Retrieve the seeded school and department IDs dynamically to avoid hardcoded ID mismatches
SET @school_id = (SELECT id FROM schools LIMIT 1);
SET @dept_id = (SELECT id FROM departments WHERE school_id = @school_id LIMIT 1);

-- Seed profiles for integration test users if they do not exist
INSERT IGNORE INTO profiles (account_id, first_name, last_name, code, school_id, department_id)
VALUES
(2, 'Tran Thi', 'B', 'GV123456', @school_id, @dept_id),
(4, 'Nguyen Van', 'An', 'SV1234567', @school_id, @dept_id);

-- Seed integration test teams
INSERT IGNORE INTO teams (id, name, description, join_code, is_active, department_id, is_approval_required)
VALUES
(1, 'Lập trình WWW (Java)', '420300362103', 'NY9ZA0', TRUE, @dept_id, FALSE);

-- Seed team memberships
INSERT IGNORE INTO team_members (id, role, account_id, team_id)
VALUES
(1, 'LEADER', 2, 1),
(2, 'MEMBER', 4, 1);
