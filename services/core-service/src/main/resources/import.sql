-- ============================================
-- Sample Data for Testing (Teams only)
-- Create accounts via /auth/register endpoint
-- ============================================

-- Insert sample schools
INSERT INTO schools (name) VALUES ('Truong THPT Le Quy Don');
INSERT INTO schools (name) VALUES ('Truong THPT Chuyen Ha Long');

-- Insert sample departments  
INSERT INTO departments (school_id, name) VALUES (1, 'Khoi 10');
INSERT INTO departments (school_id, name) VALUES (1, 'Khoi 11');
INSERT INTO departments (school_id, name) VALUES (1, 'Khoi 12');
INSERT INTO departments (school_id, name) VALUES (2, 'Khoi 10');

-- Insert sample teams
INSERT INTO teams (name, description, join_code, department_id, is_active, created_at) 
VALUES ('Khoi 10A', 'Lop 10A - Toan', '10A2024', 1, true, NOW());

INSERT INTO teams (name, description, join_code, department_id, is_active, created_at) 
VALUES ('Khoi 10B', 'Lop 10B - Ly', '10B2024', 1, true, NOW());

INSERT INTO teams (name, description, join_code, department_id, is_active, created_at) 
VALUES ('Khoi 10C', 'Lop 10C - Hoa', '10C2024', 1, true, NOW());

INSERT INTO teams (name, description, join_code, department_id, is_active, created_at) 
VALUES ('Khoi 10D', 'Lop 10D - Sinh', '10D2024', 1, true, NOW());
