-- V6: Seed Comprehensive Class & Member Data

-- 1. Create 10 Sample Student Accounts (IDs 10 to 19)
-- Password for all is "admin123" ($2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m)
INSERT INTO accounts (id, email, password_hash, is_active, is_email_verified) VALUES
(10, 'alex.rivera@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(11, 'marcus.chen@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(12, 'jordan.day@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(13, 'elena.sofia@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(14, 'oscar.wilde@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(15, 'sophia.loren@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(16, 'james.bond@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(17, 'lara.croft@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(18, 'peter.parker@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE),
(19, 'bruce.wayne@school.edu', '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m', TRUE, TRUE);

-- 2. Create Profiles for these accounts
INSERT INTO profiles (account_id, first_name, last_name, avatar_url, code, bio) VALUES
(10, 'Alex', 'Rivera', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'SV001', 'Loves algorithms and discrete math.'),
(11, 'Marcus', 'Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', 'SV002', 'Graphic design enthusiast.'),
(12, 'Jordan', 'Day', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', 'SV003', 'Junior web developer.'),
(13, 'Elena', 'Sofia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', 'SV004', 'Aspiring UI/UX designer.'),
(14, 'Oscar', 'Wilde', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar', 'SV005', 'Literature student taking coding classes.'),
(15, 'Sophia', 'Loren', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia', 'SV006', 'Data science explorer.'),
(16, 'James', 'Bond', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', 'SV007', 'Cybersecurity specialist.'),
(17, 'Lara', 'Croft', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lara', 'SV008', 'History and Tech explorer.'),
(18, 'Peter', 'Parker', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter', 'SV009', 'Fullstack enthusiast.'),
(19, 'Bruce', 'Wayne', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruce', 'SV010', 'Hardware and Robotics major.');

-- 3. Assign ROLE_STUDENT (id=1) to these accounts
INSERT INTO account_roles (account_id, role_id) VALUES
(10, 1), (11, 1), (12, 1), (13, 1), (14, 1), (15, 1), (16, 1), (17, 1), (18, 1), (19, 1);

-- 4. Create 3 Sample Teams (Classes)
INSERT INTO teams (id, name, description, join_code, is_active) VALUES
(100, 'Computer Science 101', 'Introduction to algorithms and data structures.', 'CS101XYZ', TRUE),
(200, 'Graphic Design Basics', 'Foundations of typography, color theory and layout.', 'GD2024BAS', TRUE),
(300, 'Fullstack Web Development', 'Mastering React, Node, and Spring Boot.', 'WEB300FS', TRUE);

-- 5. Assign TEACHER to these classes (Assuming your testuser@gmail.com is ID 2)
-- If your ID is different, please let me know, but typically it is 2 in this setup.
INSERT INTO team_members (team_id, account_id, role) VALUES
(100, 2, 'TEACHER'),
(200, 2, 'TEACHER'),
(300, 2, 'TEACHER');

-- 6. Assign Students to these classes
-- Computer Science 101 members
INSERT INTO team_members (team_id, account_id, role) VALUES
(100, 10, 'STUDENT'), (100, 11, 'STUDENT'), (100, 12, 'STUDENT'), (100, 15, 'STUDENT');

-- Graphic Design Basics members
INSERT INTO team_members (team_id, account_id, role) VALUES
(200, 11, 'STUDENT'), (200, 13, 'STUDENT'), (200, 14, 'STUDENT'), (200, 17, 'STUDENT');

-- Fullstack Web Development members
INSERT INTO team_members (team_id, account_id, role) VALUES
(300, 12, 'STUDENT'), (300, 18, 'STUDENT'), (100, 19, 'STUDENT'), (300, 16, 'STUDENT');
