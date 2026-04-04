INSERT INTO schools (name)
VALUES ('Đại học Công nghiệp TP.HCM');

SET @school_id = LAST_INSERT_ID();

INSERT INTO departments (school_id, name)
VALUES
    (@school_id, 'Khoa Công nghệ Thông tin'),
    (@school_id, 'Khoa Thương mại Điện tử'),
    (@school_id, 'Khoa Quản trị Kinh doanh');

INSERT INTO accounts (id, email, password_hash, role, status, is_email_verified, is_online)
VALUES (
    1,
    'admin@otteducation.local',
    '$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m',
    'ROLE_ADMIN',
    'AVAILABLE',
    TRUE,
    FALSE
);

INSERT INTO profiles (account_id, first_name, last_name, code, bio, phone, school_id, department_id)
VALUES (
    1,
    'System',
    'Admin',
    'ADMIN001',
    'System administrator account',
    NULL,
    @school_id,
    NULL
);
