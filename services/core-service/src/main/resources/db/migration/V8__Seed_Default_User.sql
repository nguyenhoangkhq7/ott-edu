-- Insert a default student account (Password: 123456)
-- Hash generated for password '123456'
INSERT INTO accounts (id, email, password_hash, role, status, is_email_verified, created_at)
VALUES (1, 'student@gmail.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOu5HEpL.xjT5.v/pNo.n8qH.2.k./qeu', 'ROLE_STUDENT', 'AVAILABLE', true, NOW())
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- Create a profile for the student
INSERT IGNORE INTO profiles (account_id, first_name, last_name, code)
VALUES (1, 'Phuc', 'Vinh', 'STUDENT001');
