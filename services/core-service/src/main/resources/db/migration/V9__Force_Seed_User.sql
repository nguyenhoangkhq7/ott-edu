-- Delete existing test data to ensure clean state
DELETE FROM profiles WHERE account_id = 1;
DELETE FROM accounts WHERE email = 'student@gmail.com' OR id = 1;

-- Insert a default student account (Password: 123456)
INSERT INTO accounts (id, email, password_hash, role, status, is_email_verified, created_at)
VALUES (1, 'student@gmail.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOu5HEpL.xjT5.v/pNo.n8qH.2.k./qeu', 'ROLE_STUDENT', 'AVAILABLE', true, NOW());

-- Create a profile for the student
INSERT INTO profiles (account_id, first_name, last_name, code)
VALUES (1, 'Phuc', 'Vinh', 'STUDENT001');
