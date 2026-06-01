INSERT INTO accounts (id, email, password_hash, role, status, is_email_verified, is_online)
VALUES (
    99,
    'ci_admin@otteducation.local',
    '$2a$10$cuivGw6/c6spwYj6XNb2P.P7HsD4a6GdfKRF4WL5EUJ9XfWXGttWe',
    'ROLE_ADMIN',
    'AVAILABLE',
    TRUE,
    FALSE
);

SET @school_id = (SELECT id FROM schools LIMIT 1);
SET @dept_id = (SELECT id FROM departments LIMIT 1);

INSERT INTO profiles (account_id, first_name, last_name, code, bio, phone, school_id, department_id)
VALUES (
    99,
    'CI',
    'Admin',
    'CI_ADMIN001',
    'CI test admin',
    NULL,
    @school_id,
    @dept_id
);
